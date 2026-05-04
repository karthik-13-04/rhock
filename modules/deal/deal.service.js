import Offer from '../../models/offer.model.js';
import Store from '../../models/store.model.js';
import { dbConnect } from '../../config/database.js';

/**
 * Deal Service
 * Handles public retrieval of approved offers (deals)
 */
export class DealService {
  /**
   * Fetch all approved deals with optional filtering
   * @param {Object} options - { category, lat, lng, limit }
   */
  static async getDeals({ category, lat, lng, limit = 20 }) {
    await dbConnect();

    const query = { status: 'approved' };

    // 1. Filter by Category (if provided)
    if (category) {
      query.category = category;
    }

    // 2. Fetch Deals
    let deals = await Offer.find(query)
      .populate({
        path: 'storeId',
        select: 'businessName location address'
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // 3. Location Filter (if lat/lng provided)
    // For now, we'll return all and could add geospatial logic later if needed
    // But basic population is enough for the current request

    return deals.map(deal => ({
      offerId: deal._id,
      title: deal.title,
      description: deal.description,
      discountValue: deal.discountValue,
      discountType: deal.discountType,
      images: deal.images,
      store: {
        businessName: deal.storeId?.businessName,
        location: {
          lat: deal.storeId?.location?.coordinates[1],
          lng: deal.storeId?.location?.coordinates[0]
        },
        address: deal.storeId?.address
      }
    }));
  }
}
