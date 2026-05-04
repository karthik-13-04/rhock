import mongoose from 'mongoose';
import Ads from '../../models/ads.model.js';
import Subscription from '../../models/subscription.model.js';

/**
 * Ads Service
 * Handles business logic for Ad management and Credit deduction
 */
export class AdsService {
  /**
   * Create an Ad and deduct 1 credit atomically
   * @param {string} vendorId
   * @param {Object} adData Ad fields (title, description, targetUrl, imageUrl)
   */
  static async createAdWithCredit(vendorId, adData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Find an active, non-expired subscription for this vendor
      const subscription = await Subscription.findOne({
        vendorId,
        expiryDate: { $gt: new Date() },
      }).session(session);

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // 2. Check if credits are available
      const remainingCredits = subscription.creditsTotal - subscription.creditsUsed;
      if (remainingCredits <= 0) {
        throw new Error('Insufficient credits');
      }

      // 3. Create the Ad record
      const ad = new Ads({
        vendorId,
        ...adData,
        status: 'pending',
        views: 0
      });

      await ad.save({ session });

      // 4. Deduct 1 credit
      subscription.creditsUsed += 1;
      await subscription.save({ session });

      // 5. Commit the transaction
      await session.commitTransaction();
      
      return {
        ad,
        remainingCredits: subscription.creditsTotal - subscription.creditsUsed
      };
    } catch (error) {
      // Abort transaction on any failure
      await session.abortTransaction();
      console.error('[AdsService Transaction Aborted]', error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get active subscription details for a vendor
   * @param {string} vendorId
   */
  static async getVendorSubscription(vendorId) {
    return await Subscription.findOne({
      vendorId,
      expiryDate: { $gt: new Date() },
    });
  }

  /**
   * Get paginated ads for a specific vendor with optional status filtering
   * @param {string} vendorId 
   * @param {Object} options { status, page, limit }
   */
  static async getVendorAds(vendorId, options = {}) {
    const { status, page = 1, limit = 10 } = options;

    // 1. Build Query
    const query = { vendorId };
    if (status) {
      query.status = status;
    }

    // 2. Pagination Math
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

    // 3. Execute Query and Count in Parallel
    const [ads, total] = await Promise.all([
      Ads.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Ads.countDocuments(query)
    ]);

    return {
      ads,
      total,
      page: Number(page),
      limit: Number(limit)
    };
  }

  /**
   * Update an existing Ad with re-approval logic
   * @param {string} vendorId 
   * @param {string} adId 
   * @param {Object} updateData 
   */
  static async updateVendorAd(vendorId, adId, updateData) {
    // 1. Find Ad and verify ownership
    const ad = await Ads.findOne({ _id: adId, vendorId });
    if (!ad) {
      throw new Error('Ad not found or unauthorized');
    }

    // 2. Map fields and update (partial update supported)
    const { title, description, targetUrl, imageUrl, imageKey } = updateData;

    if (title) ad.title = title;
    if (description) ad.description = description;
    if (targetUrl) ad.targetUrl = targetUrl;
    if (imageUrl) ad.imageUrl = imageUrl;
    if (imageKey) ad.imageKey = imageKey;

    // 3. Mandatory re-approval
    ad.status = 'pending';

    await ad.save();
    return ad;
  }
}
