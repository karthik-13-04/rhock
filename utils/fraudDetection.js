import User from '../models/user.model.js';
import CoinTransaction from '../models/coinTransaction.model.js';
import AuditLog from '../models/auditLog.model.js';

/**
 * Fraud Detection Engine
 * Analyzes patterns to flag suspicious activity
 */
export class FraudDetection {
  // Threshold to auto-flag a user
  static SCORE_THRESHOLD = 50;

  /**
   * Analyze a coin redemption attempt
   * @param {string} userId
   * @param {number} coins
   * @returns {Promise<Object>} { isFlagged, fraudScore }
   */
  static async analyzeRedemption(userId, coins) {
    const user = await User.findById(userId);
    if (!user) return { isFlagged: false, fraudScore: 0 };

    let scoreIncrement = 0;
    const triggers = [];

    // 1. Frequency Check: Too many transactions in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyCount = await CoinTransaction.countDocuments({
      userId: user._id,
      status: 'completed',
      createdAt: { $gte: oneHourAgo }
    });

    if (hourlyCount >= 5) {
      scoreIncrement += 20;
      triggers.push('High transaction frequency (>= 5 in 1h)');
    }

    // 2. Volume Check: Large coin transfer
    if (coins >= 5000) {
      scoreIncrement += 15;
      triggers.push('High volume coin transfer (> 5000)');
    }

    // 3. Multi-Account Check: Same deviceId linked to multiple users
    if (user.deviceId) {
      const linkedUsersCount = await User.countDocuments({
        deviceId: user.deviceId,
        _id: { $ne: user._id }
      });
      if (linkedUsersCount >= 2) {
        scoreIncrement += 30;
        triggers.push('Device sharing across multiple accounts');
      }
    }

    // 4. IP Pattern Check (Simplified)
    if (user.ipAddress) {
       const linkedIpsCount = await User.countDocuments({
        ipAddress: user.ipAddress,
        _id: { $ne: user._id }
      });
      if (linkedIpsCount >= 5) {
        scoreIncrement += 10;
        triggers.push('IP sharing across many accounts (>= 5)');
      }
    }

    // Apply score and flag if needed
    if (scoreIncrement > 0) {
      user.fraudScore = (user.fraudScore || 0) + scoreIncrement;
      
      if (user.fraudScore >= this.SCORE_THRESHOLD && !user.isFlagged) {
        user.isFlagged = true;
        
        // Log critical event
        await new AuditLog({
          action: 'FRAUD_USER_FLAGGED',
          userId: user._id,
          role: 'system',
          entityId: user._id,
          entityType: 'user',
          actionType: 'fraud_flag',
          severity: 'critical',
          metadata: { 
            finalScore: user.fraudScore, 
            triggers,
            lastCoins: coins 
          }
        }).save();
      } else {
        // Log moderate warning
        await new AuditLog({
          action: 'FRAUD_SCORE_INCREASE',
          userId: user._id,
          role: 'system',
          entityId: user._id,
          entityType: 'user',
          actionType: 'update',
          severity: 'medium',
          metadata: { increment: scoreIncrement, triggers }
        }).save();
      }
      
      await user.save();
    }

    return { isFlagged: user.isFlagged, fraudScore: user.fraudScore };
  }
}
