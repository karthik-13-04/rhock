import User from '../../models/user.model.js';
import ReferralLog from '../../models/referralLog.model.js';
import mongoose from 'mongoose';

/**
 * User Service
 * Handles business logic for user profile and wallet data
 */
export class UserService {
  /**
   * Fetch a user's core profile data by their ID
   * @param {string} userId - The unique identifier of the user
   * @returns {Object|null} Sanitized user data
   */
  static async getUserProfile(userId) {
    // We only select the non-sensitive fields required for the profile view
    const user = await User.findById(userId)
      .select('firstName lastName email profileImage phone referralCode coinBalance createdAt')
      .lean();

    return user;
  }

  /**
   * Update user profile details (Name, Email, Image, onboarding status)
   * @param {string} userId 
   * @param {Object} updateData { name, email, profileImage }
   */
  static async updateProfile(userId, { name, email, profileImage }) {
    const updateFields = { profileCompleted: true };

    if (name) {
      const nameParts = name.trim().split(' ');
      updateFields.firstName = nameParts[0];
      updateFields.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }

    if (email) {
      updateFields.email = email.toLowerCase().trim();
    }

    if (profileImage) {
      updateFields.profileImage = profileImage;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).select('firstName lastName email phone profileImage profileCompleted');

    if (!user) throw new Error('User account not found');

    return user;
  }

  /**
   * Apply a referral code and reward both users using an atomic transaction
   * @param {string} newUserId 
   * @param {string} referralCode 
   * @param {Object} metadata { deviceId, ipAddress }
   */
  static async applyReferral(newUserId, referralCode, { deviceId, ipAddress } = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Fetch the new user applying the code
      const newUser = await User.findById(newUserId).session(session);
      if (!newUser) throw new Error('User account not found');

      // 2. Abuse Prevention: Only one referral allowed per user
      if (newUser.referredBy || newUser.referralUsed) {
        throw new Error('Referral code already applied for this account');
      }

      // 2a. Abuse Prevention: Device limits (Max 2 per day)
      if (deviceId) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const deviceUsageCount = await ReferralLog.countDocuments({
          deviceId,
          createdAt: { $gte: startOfDay }
        }).session(session);

        if (deviceUsageCount >= 2) {
          throw new Error('Maximum referral limit reached for this device today');
        }
      }

      // 3. Identification: Find the referrer owning the code
      const referrer = await User.findOne({ referralCode }).session(session);
      if (!referrer) {
        throw new Error('The provided referral code is invalid');
      }

      // 4. Abuse Prevention: Self-referral is forbidden
      if (referrer._id.toString() === newUserId.toString()) {
        throw new Error('You cannot refer yourself');
      }

      // 5. Update New User Balance & Link Referrer
      newUser.referredBy = referrer._id;
      newUser.referralUsed = true;
      newUser.deviceId = deviceId;
      newUser.ipAddress = ipAddress;
      newUser.coinBalance = (newUser.coinBalance || 0) + 200;
      await newUser.save({ session, validateBeforeSave: false });

      // 6. Update Referrer Balance
      referrer.coinBalance = (referrer.coinBalance || 0) + 500;
      await referrer.save({ session, validateBeforeSave: false });

      // 7. Ledger: Create an immutable log for growth tracking
      const log = new ReferralLog({
        referrerId: referrer._id,
        newUserId: newUser._id,
        coinsGivenToReferrer: 500,
        coinsGivenToUser: 200,
        deviceId,
        ipAddress
      });
      await log.save({ session });

      // 8. Finalize Transaction
      await session.commitTransaction();
      
      return {
        referrerCoins: 500,
        newUserCoins: 200
      };

    } catch (error) {
      // Rollback all changes if any step fails
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
