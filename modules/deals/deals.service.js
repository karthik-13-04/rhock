import mongoose from 'mongoose';
import Ads from '../../models/ads.model.js';
import Vendor from '../../models/vendor.model.js';
import Category from '../../models/category.model.js';

/**
 * Deals Service
 * Specifically for public discovery and listing of approved deals
 */
export class DealsService {
  /**
   * Fetch approved deals with search, category filter, and pagination
   * @param {Object} filters { search, categoryId, page, limit }
   */
  static async getDeals(filters) {
    const { search, categoryId, page = 1, limit = 10 } = filters;
    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const limitNum = Math.max(1, Number(limit));

    // 1. Initial Pipeline
    const pipeline = [
      // Only approved deals
      { $match: { status: 'approved' } },

      // Join with Vendor to get store info and categoryId
      {
        $lookup: {
          from: 'vendors',
          localField: 'vendorId',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      // Ensure we only have deals with valid vendor info
      { $unwind: '$vendor' },

      // Join with Category to get the name
      {
        $lookup: {
          from: 'categories',
          localField: 'vendor.categoryId',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      // Some vendors might not have a category assigned yet or it might be deleted
      { $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } }
    ];

    // 2. Dynamic Filters
    const matchFilters = {};

    // Filter by Category if provided
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      matchFilters['vendor.categoryId'] = new mongoose.Types.ObjectId(categoryId);
    }

    // Filter by Search (Title or Store Name)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      matchFilters.$or = [
        { title: searchRegex },
        { 'vendor.storeName': searchRegex }
      ];
    }

    if (Object.keys(matchFilters).length > 0) {
      pipeline.push({ $match: matchFilters });
    }

    // 3. Faceted Results (Count + Data)
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limitNum },
          {
            $project: {
              _id: 1,
              title: 1,
              description: 1,
              imageUrl: 1,
              views: 1,
              createdAt: 1,
              store: {
                storeName: '$vendor.storeName',
                // Fallback: district -> state -> 'Remote'
                location: { 
                  $ifNull: [
                    '$vendor.location.district', 
                    { $ifNull: ['$vendor.location.state', 'Multiple Locations'] }
                  ] 
                }
              },
              // Return category name or "General"
              category: { $ifNull: ['$categoryDetails.name', 'General'] }
            }
          }
        ]
      }
    });

    // 4. Execute
    const result = await Ads.aggregate(pipeline);

    // 5. Post-process result format
    const total = result[0]?.metadata[0]?.total || 0;
    const deals = result[0]?.data || [];

    return {
      deals,
      total,
      page: Number(page),
      limit: Number(limit)
    };
  }
}
