import User from '../../models/user.model.js';
import Vendor from '../../models/vendor.model.js';
import RedemptionRequest from '../../models/redemptionRequest.model.js';
import WalletTransaction from '../../models/walletTransaction.model.js';
import VendorTransaction from '../../models/vendorTransaction.model.js';
import mongoose from 'mongoose';

/**
 * Redemptions Service
 * Manages vendor redemption requests, user approval workflows, and transaction ledgers
 */
export class RedemptionsService {
  /**
   * Vendor requests to redeem coins from a user
   * @param {string} vendorUserId - User ID of the Vendor
   * @param {string} userUniqueCode 
   * @param {number} coinAmount 
   */
  static async requestRedeem(vendorUserId, userUniqueCode, coinAmount) {
    // 1. Fetch Vendor
    const vendor = await Vendor.findOne({ userId: vendorUserId });
    if (!vendor) throw new Error('Vendor profile not found');
    if (vendor.status !== 'active') throw new Error('Vendor account is not active');

    // 2. Fetch User by Redemption Code
    const user = await User.findOne({ uniqueRedeemCode: userUniqueCode });
    if (!user) throw new Error('User not found with the provided redemption code');
    if (user.status !== 'active') throw new Error('User account is currently not active');

    // 3. Balance verification
    if (user.coinBalance < coinAmount) {
      throw new Error(`User does not have enough coins. Available: ${user.coinBalance}`);
    }

    // 4. Create pending request
    const request = new RedemptionRequest({
      user: user._id,
      vendor: vendor._id,
      coinAmount,
      userUniqueCode,
      status: 'PENDING'
    });
    await request.save();

    // 5. Send Real-time Push Notification to user
    try {
      const { PushNotificationService } = await import('../../services/push-notification.service.js');
      const tokens = PushNotificationService.extractValidTokensFromUsers([user]);
      if (tokens.length > 0) {
        await PushNotificationService.sendToTokens(tokens, {
          title: 'Redemption Request Received',
          body: `Vendor "${vendor.storeName}" wants to redeem ${coinAmount} coins from your wallet.`,
          type: 'redemption_request',
          metadata: {
            requestId: request._id.toString(),
            coinAmount: coinAmount.toString()
          }
        });
      }
    } catch (err) {
      console.error('Failed to send push notification to user:', err.message);
    }

    return request;
  }

  /**
   * User approves a redemption request
   * @param {string} userId 
   * @param {string} requestId 
   */
  static async approveRedemption(userId, requestId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const request = await RedemptionRequest.findById(requestId).session(session);
      if (!request) throw new Error('Redemption request not found');
      if (request.status !== 'PENDING') throw new Error('Request has already been processed');
      if (request.user.toString() !== userId.toString()) {
        throw new Error('Unauthorized to approve this request');
      }

      const user = await User.findById(userId).session(session);
      const vendor = await Vendor.findById(request.vendor).session(session);

      if (!user || !vendor) throw new Error('User or Vendor record missing');

      // Final balance verification under transactional lock
      if (user.coinBalance < request.coinAmount) {
        throw new Error('Insufficient balance for redemption approval');
      }

      const userOldBalance = user.coinBalance;
      const vendorOldBalance = vendor.coinBalance || 0;

      // Double-entry transfer
      user.coinBalance = userOldBalance - request.coinAmount;
      vendor.coinBalance = vendorOldBalance + request.coinAmount;

      request.status = 'APPROVED';
      request.approvedAt = new Date();

      // Save documents
      await user.save({ session });
      await vendor.save({ session });
      await request.save({ session });

      // Create transaction history ledgers
      const userTx = new WalletTransaction({
        user: user._id,
        type: 'debit',
        amount: request.coinAmount,
        balanceBefore: userOldBalance,
        balanceAfter: user.coinBalance,
        transactionType: 'REDEMPTION_DEBIT',
        referenceId: request._id
      });
      await userTx.save({ session });

      const vendorTx = new VendorTransaction({
        vendor: vendor._id,
        amount: request.coinAmount,
        type: 'credit',
        redemptionRequest: request._id
      });
      await vendorTx.save({ session });

      // Audit Log log entries
      const AuditLog = (await import('../../models/auditLog.model.js')).default;
      await new AuditLog({
        action: 'COIN_REDEMPTION_APPROVED',
        userId: user._id,
        role: 'user',
        entityId: request._id,
        entityType: 'redemption_request',
        actionType: 'update',
        severity: 'low',
        metadata: { vendorId: vendor._id, amount: request.coinAmount }
      }).save({ session });

      // Push Notification to Vendor's user account
      try {
        const vendorUser = await User.findById(vendor.userId).session(session);
        if (vendorUser) {
          const { PushNotificationService } = await import('../../services/push-notification.service.js');
          const tokens = PushNotificationService.extractValidTokensFromUsers([vendorUser]);
          if (tokens.length > 0) {
            await PushNotificationService.sendToTokens(tokens, {
              title: 'Redemption Request Approved',
              body: `User has approved your request. ${request.coinAmount} coins have been added to your wallet.`,
              type: 'redemption_approved',
              metadata: {
                requestId: request._id.toString()
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to notify vendor of approved request:', err.message);
      }

      await session.commitTransaction();
      return request;

    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * User rejects a redemption request
   * @param {string} userId 
   * @param {string} requestId 
   */
  static async rejectRedemption(userId, requestId) {
    const request = await RedemptionRequest.findById(requestId);
    if (!request) throw new Error('Redemption request not found');
    if (request.status !== 'PENDING') throw new Error('Request has already been processed');
    if (request.user.toString() !== userId.toString()) {
      throw new Error('Unauthorized to reject this request');
    }

    request.status = 'REJECTED';
    request.rejectedAt = new Date();
    await request.save();

    // Push Notification to Vendor User
    try {
      const vendor = await Vendor.findById(request.vendor);
      if (vendor) {
        const vendorUser = await User.findById(vendor.userId);
        if (vendorUser) {
          const { PushNotificationService } = await import('../../services/push-notification.service.js');
          const tokens = PushNotificationService.extractValidTokensFromUsers([vendorUser]);
          if (tokens.length > 0) {
            await PushNotificationService.sendToTokens(tokens, {
              title: 'Redemption Request Rejected',
              body: `The user has rejected your request to redeem ${request.coinAmount} coins.`,
              type: 'redemption_rejected',
              metadata: {
                requestId: request._id.toString()
              }
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to notify vendor of rejected request:', err.message);
    }

    return request;
  }

  /**
   * Get pending redemption requests for user
   * @param {string} userId 
   */
  static async getPending(userId) {
    const pending = await RedemptionRequest.find({ user: userId, status: 'PENDING' })
      .populate('vendor', 'storeName profileImage')
      .sort({ createdAt: -1 });
    return pending;
  }

  /**
   * Get historical redemption logs for a vendor
   * @param {string} vendorUserId 
   */
  static async getVendorHistory(vendorUserId) {
    const vendor = await Vendor.findOne({ userId: vendorUserId });
    if (!vendor) throw new Error('Vendor profile not found');

    const history = await RedemptionRequest.find({ vendor: vendor._id })
      .populate('user', 'firstName lastName email uniqueRedeemCode')
      .sort({ createdAt: -1 });
    return history;
  }

  /**
   * Dynamic stats summary of a User's coin wallet
   * @param {string} userId 
   */
  static async getUserWalletStats(userId) {
    const user = await User.findById(userId).select('coinBalance');
    if (!user) throw new Error('User not found');

    const credits = await WalletTransaction.aggregate([
      { $match: { user: user._id, type: 'credit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const debits = await WalletTransaction.aggregate([
      { $match: { user: user._id, type: 'debit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pending = await RedemptionRequest.aggregate([
      { $match: { user: user._id, status: 'PENDING' } },
      { $group: { _id: null, total: { $sum: '$coinAmount' } } }
    ]);

    return {
      balance: user.coinBalance || 0,
      totalEarned: credits[0]?.total || 0,
      totalSpent: debits[0]?.total || 0,
      pendingRedemption: pending[0]?.total || 0
    };
  }
}
