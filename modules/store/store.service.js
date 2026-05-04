import mongoose from 'mongoose';
import Vendor from '../../models/vendor.model.js';
import Ads from '../../models/ads.model.js';

/**
 * Store Service
 * Handles complex store and deal aggregation logic
 */
export class StoreService {
  /**
   * Fetch complete store details along with its approved deals
   * @param {string} storeId (Vendor _id)
   */
  static async getStoreDetails(storeId) {
    // 1. Fetch Active Vendor
    // We strictly filter for 'active' status and select only public fields
    const vendor = await Vendor.findOne({ 
      _id: storeId, 
      status: 'active' 
    })
    .select('_id storeName storeAbout mobileNumber location fullAddress media workingHours')
    .lean();

    if (!vendor) {
      return null;
    }

    // 2. Fetch Approved Deals for this store
    // Sort by createdAt DESC for latest deals first
    const deals = await Ads.find({ 
      vendorId: storeId, 
      status: 'approved' 
    })
    .sort({ createdAt: -1 })
    .select('_id title description imageUrl views')
    .lean();

    // 3. Format response structure according to User Discovery patterns
    const store = {
      _id: vendor._id,
      storeName: vendor.storeName,
      about: vendor.storeAbout,
      contactNumber: vendor.mobileNumber,
      location: {
        address: vendor.fullAddress || '',
        state: vendor.location?.state || '',
        district: vendor.location?.district || ''
      },
      workingHours: vendor.workingHours || 'Not specified',
      media: vendor.media || { thumbnailUrl: '', bannerUrl: '' },
      // Future-proofing for ratings/reviews
      rating: 0, 
      totalReviews: 0
    };

    return {
      store,
      deals
    };
  }

  /**
   * Search and filter stores based on name, category, and location
   * @param {Object} options { search, categoryId, latitude, longitude, radius, page, limit }
   */
  static async searchStores(options) {
    const { search, categoryId, latitude, longitude, radius = 10, page = 1, limit = 10 } = options;
    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const limitNum = Math.max(1, Number(limit));

    const pipeline = [];

    // 1. Geospatial Search (Must be first stage if using $geoNear)
    // $geoNear is required to calculate and return the 'distance' field
    if (latitude && longitude) {
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          maxDistance: parseFloat(radius) * 1000, // Convert KM to Meters
          spherical: true,
          query: { status: 'active' } // Filter active stores within the geo stage
        }
      });
    } else {
      // Regular filter if no geo-search params provided
      pipeline.push({ $match: { status: 'active' } });
    }

    // 2. Search Filter (Store Name Regex)
    if (search) {
      pipeline.push({
        $match: {
          storeName: { $regex: new RegExp(search, 'i') }
        }
      });
    }

    // 3. Category Filter
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      pipeline.push({
        $match: {
          categoryId: new mongoose.Types.ObjectId(categoryId)
        }
      });
    }

    // 4. Join with Categories for display name
    pipeline.push({
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'categoryDetails'
      }
    });

    pipeline.push({
      $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true }
    });

    // 5. Faceted Results for total count and pagination
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          // If geo-search was used, results are sorted by distance naturally
          // Fallback to name sorting
          { $sort: { distance: 1, storeName: 1 } },
          { $skip: skip },
          { $limit: limitNum },
          {
            $project: {
              _id: 1,
              storeName: 1,
              category: { $ifNull: ['$categoryDetails.name', 'General'] },
              location: {
                address: { $ifNull: ['$location.district', '$location.state'] }
              },
              distance: { 
                $cond: [
                  { $gt: ['$distance', null] }, 
                  { $round: [{ $divide: ['$distance', 1000] }, 1] }, // Round to 1 decimal place (KM)
                  null
                ] 
              },
              thumbnailUrl: '$media.thumbnailUrl'
            }
          }
        ]
      }
    });

    const result = await Vendor.aggregate(pipeline);

    const total = result[0]?.metadata[0]?.total || 0;
    const stores = result[0]?.data || [];

    return {
      stores,
      total,
      page: Number(page),
      limit: Number(limit)
    };
  }
}
