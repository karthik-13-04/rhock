import User from '../../models/user.model.js';
import Referral from '../../models/referral.model.js';
import ReferralSetting from '../../models/referralSetting.model.js';
import WalletTransaction from '../../models/walletTransaction.model.js';
import mongoose from 'mongoose';

/**
 * Referrals Service
 * Handles user invites, relationship mapping, rewards, and tree nodes structure
 */
export class ReferralsService {
  /**
   * Generates or returns custom shareable registration referral link
   * @param {string} userId 
   */
  static async generateLink(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    if (!user.referralCode) {
      const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
      user.referralCode = `USR-${rand}`;
      await user.save();
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rhock.com';
    const link = `${baseUrl}/register?ref=${user.referralCode}`;
    
    return {
      referralCode: user.referralCode,
      referralLink: link
    };
  }

  /**
   * Get successful referrals history for a user
   * @param {string} userId 
   */
  static async getHistory(userId) {
    const referrals = await Referral.find({ referrer: userId })
      .populate('referred', 'firstName lastName email phone coinBalance')
      .sort({ createdAt: -1 });
    return referrals;
  }

  /**
   * Get dynamic multi-level tree structure for user's referrals (to render on visual graph)
   * @param {string} userId 
   */
  static async getTree(userId) {
    const directReferrals = await Referral.find({ referrer: userId })
      .populate('referred', 'firstName lastName email coinBalance');

    const userObj = await User.findById(userId).select('firstName lastName email');
    const myName = userObj?.firstName ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : 'User';

    const tree = {
      id: userId.toString(),
      name: myName,
      coinsEarned: directReferrals.reduce((sum, r) => sum + (r.rewardCoins || 0), 0),
      children: []
    };

    for (const r of directReferrals) {
      if (!r.referred) continue;
      
      const childId = r.referred._id;
      const secReferrals = await Referral.find({ referrer: childId })
        .populate('referred', 'firstName lastName email');
      
      tree.children.push({
        id: childId.toString(),
        name: r.referred.firstName ? `${r.referred.firstName} ${r.referred.lastName || ''}`.trim() : 'User',
        coinsEarned: r.rewardCoins,
        children: secReferrals.map(sr => ({
          id: sr.referred?._id?.toString() || 'sec',
          name: sr.referred?.firstName ? `${sr.referred.firstName} ${sr.referred.lastName || ''}`.trim() : 'User',
          coinsEarned: sr.rewardCoins,
          children: []
        }))
      });
    }

    return tree;
  }

  /**
   * Link a new registered user to their referring user
   * @param {string} referredUserId 
   * @param {string} referralCode 
   */
  static async handleReferralSignup(referredUserId, referralCode) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const referrerUser = await User.findOne({ referralCode }).session(session);
      if (!referrerUser) {
        throw new Error('Invalid referral code');
      }

      if (referrerUser._id.toString() === referredUserId.toString()) {
        throw new Error('Self referral is not allowed');
      }

      const referredUser = await User.findById(referredUserId).session(session);
      if (!referredUser) {
        throw new Error('Referred user not found');
      }

      if (referredUser.referredBy) {
        throw new Error('User has already been referred');
      }

      // 1. Fetch settings
      let settings = await ReferralSetting.findOne().session(session);
      if (!settings) {
        settings = new ReferralSetting();
        await settings.save({ session });
      }

      // Check daily limit for referrer
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const dailyCount = await Referral.countDocuments({
        referrer: referrerUser._id,
        createdAt: { $gte: startOfDay }
      }).session(session);

      if (dailyCount >= settings.dailyReferralLimit) {
        console.warn(`Referrer daily limit of ${settings.dailyReferralLimit} reached.`);
        referredUser.referredBy = referrerUser._id;
        referredUser.referralUsed = true;
        await referredUser.save({ session });
        
        const refObj = new Referral({
          referrer: referrerUser._id,
          referred: referredUser._id,
          rewardCoins: 0,
          status: 'pending'
        });
        await refObj.save({ session });
        
        await session.commitTransaction();
        return { success: true, reward: 0 };
      }

      // 2. Perform reward and updates
      referredUser.referredBy = referrerUser._id;
      referredUser.referralUsed = true;
      
      const coins = settings.coinsPerReferral;
      const oldBalance = referrerUser.coinBalance || 0;
      
      referrerUser.coinBalance = oldBalance + coins;

      // 3. Create records
      const referralObj = new Referral({
        referrer: referrerUser._id,
        referred: referredUser._id,
        rewardCoins: coins,
        status: 'completed'
      });
      await referralObj.save({ session });

      const tx = new WalletTransaction({
        user: referrerUser._id,
        type: 'credit',
        amount: coins,
        balanceBefore: oldBalance,
        balanceAfter: oldBalance + coins,
        transactionType: 'REFERRAL_REWARD',
        referenceId: referralObj._id
      });
      await tx.save({ session });

      await referredUser.save({ session });
      await referrerUser.save({ session });

      // Trigger Push Notification to referrer
      try {
        const { PushNotificationService } = await import('../../services/push-notification.service.js');
        const tokens = PushNotificationService.extractValidTokensFromUsers([referrerUser]);
        if (tokens.length > 0) {
          await PushNotificationService.sendToTokens(tokens, {
            title: 'Coins Received!',
            body: `You earned ${coins} coins for referring ${referredUser.firstName || 'a friend'}!`,
            type: 'referral_reward'
          });
        }
      } catch (err) {
        console.error('Failed to trigger referral push notification:', err.message);
      }

      await session.commitTransaction();
      return { success: true, reward: coins };

    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
}
