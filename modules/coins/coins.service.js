import User from '../../models/user.model.js';
import Vendor from '../../models/vendor.model.js';
import CoinTransaction from '../../models/coinTransaction.model.js';
import { generateOtp } from '../../utils/generateOtp.js';
import { hashData, compareHash } from '../../utils/hash.js';
import { calculateDistance } from '../../utils/geo.js';
import { FraudDetection } from '../../utils/fraudDetection.js';
import mongoose from 'mongoose';

/**
 * Coins Service
 * Handles user searching and coin redemption lifecycle
 */
export class CoinsService {
  /**
   * Initiate a coin redemption request
   * @param {string} vendorId 
   * @param {string} referralCode 
   * @param {number} coins 
   * @param {Object} coords { latitude, longitude }
   */
  static async initiateRedemption(vendorId, referralCode, coins, { latitude, longitude }) {
    // 0. Fetch Vendor for Geo-validation
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    if (!vendor.locationCoordinates || !vendor.locationCoordinates.coordinates) {
      throw new Error('Vendor location not configured. Redemption disabled.');
    }

    // vendor.locationCoordinates.coordinates is [lng, lat] (MongoDB format)
    const [vendorLng, vendorLat] = vendor.locationCoordinates.coordinates;
    
    const distance = calculateDistance(latitude, longitude, vendorLat, vendorLng);
    if (distance > 100) {
      throw new Error(`Location verification failed. You are ${Math.round(distance)}m away. Max allowed is 100m.`);
    }

    // 1. Find the user by referral code
    const user = await User.findOne({ referralCode });
    if (!user) {
      throw new Error('User not found with the provided referral code');
    }

    // 1a. Fraud Check: Block flagged users
    if (user.isFlagged) {
      throw new Error('Your account has been flagged for suspicious activity. Redemption is disabled.');
    }

    // 1b. Fraud Check: Analyze redemption attempt
    const fraudResult = await FraudDetection.analyzeRedemption(user._id, coins);
    if (fraudResult.isFlagged) {
      throw new Error('Suspicious activity detected. Transaction blocked for security review.');
    }

    // 2. Validate balance
    if (user.coinBalance < coins) {
      throw new Error('Insufficient balance for redemption');
    }

    // 3. Prepare initial OTP data (to keep schema valid)
    // In this flow, Step 1 is "initiated", Step 2 is "otp_sent"
    const otp = 'PENDING'; 
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); 

    // 4. Create transaction record
    const transaction = new CoinTransaction({
      vendorId,
      userId: user._id,
      coins,
      status: 'initiated',
      otp,
      otpExpiry
    });

    await transaction.save();

    // 5. Return summary (Limited info for security)
    return {
      user: {
        userId: user._id,
        name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User',
        availableCoins: user.coinBalance
      },
      transactionId: transaction._id
    };
  }

  /**
   * Send OTP to user for confirming redemption
   * @param {string} vendorId 
   * @param {string} transactionId 
   */
  static async sendOtpToUser(vendorId, transactionId) {
    // 1. Find transaction
    const transaction = await CoinTransaction.findOne({ 
      _id: transactionId, 
      vendorId 
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'initiated') {
      throw new Error(`Cannot send OTP for transaction with status: ${transaction.status}`);
    }

    // 2. Rate Limiting Check
    const now = new Date();
    if (transaction.otpLastSentAt) {
      const secondsSinceLastOtp = (now - new Date(transaction.otpLastSentAt)) / 1000;
      if (secondsSinceLastOtp < 30) {
        throw new Error(`Please wait ${Math.ceil(30 - secondsSinceLastOtp)} seconds before requesting a new OTP.`);
      }
    }

    if (transaction.otpResendCount >= 3) {
      throw new Error('Maximum OTP resend limit reached for this transaction.');
    }

    // 3. Generate and Hash OTP
    const plainOtp = generateOtp();
    const hashedOtp = await hashData(plainOtp);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 4. Fetch User mobile number
    const user = await User.findById(transaction.userId).select('phone firstName');
    if (!user) {
      throw new Error('User associated with transaction not found');
    }

    // 5. Update Transaction
    transaction.otp = hashedOtp;
    transaction.otpExpiry = otpExpiry;
    transaction.status = 'otp_sent';
    transaction.attempts = 0; // Reset attempts on new OTP send
    transaction.otpLastSentAt = now;
    transaction.otpResendCount += 1;
    await transaction.save();

    // 5. Build/Send "Mock SMS"
    const message = `Hello ${user.firstName || 'User'}, your OTP for redeeming ${transaction.coins} coins is ${plainOtp}. It expires in 5 minutes.`;
    
    console.log('--------------------------------------------------');
    console.log(`📲 [SMS GATEWAY MOCK] To: ${user.phone}`);
    console.log(`💬 Message: ${message}`);
    console.log('--------------------------------------------------');

    return { success: true };
  }

  /**
   * Verify OTP and complete the coin transfer
   * @param {string} vendorId 
   * @param {string} transactionId 
   * @param {string} inputOtp 
   * @param {string} idempotencyKey (Optional)
   */
  static async verifyAndCompleteRedemption(vendorId, transactionId, inputOtp, idempotencyKey = null) {
    // 1. Find transaction
    const transaction = await CoinTransaction.findOne({ 
      _id: transactionId, 
      vendorId 
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // 1a. Idempotency Check (by Key or status)
    if (transaction.status === 'completed' || (idempotencyKey && transaction.idempotencyKey === idempotencyKey)) {
      return {
        transactionId: transaction._id,
        coinsTransferred: transaction.coins,
        status: transaction.status,
        alreadyProcessed: true
      };
    }

    if (transaction.status !== 'otp_sent') {
      throw new Error(`Invalid transaction state: ${transaction.status}`);
    }

    // 2. Check Expiry
    if (new Date() > transaction.otpExpiry) {
      transaction.status = 'failed';
      await transaction.save();
      throw new Error('OTP has expired');
    }

    // 3. Check Attempts
    if (transaction.attempts >= 5) {
      transaction.status = 'failed';
      await transaction.save();
      throw new Error('Maximum verification attempts exceeded');
    }

    // 4. Verify OTP (crypto comparison)
    const isMatch = await compareHash(inputOtp, transaction.otp);
    if (!isMatch) {
      transaction.attempts += 1;
      await transaction.save();
      throw new Error('Invalid OTP');
    }

    // 5. Atomic Fulfillment (Double-Entry Transfer)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find records
      const user = await User.findById(transaction.userId).session(session);
      const vendor = await Vendor.findById(transaction.vendorId).session(session);

      if (!user || !vendor) {
        throw new Error('User or Vendor record missing');
      }

      // Final balance check
      if (user.coinBalance < transaction.coins) {
        throw new Error('User has insufficient balance for this redemption');
      }

      // Execute Transfer
      user.coinBalance -= transaction.coins;
      vendor.coinBalance += transaction.coins;

      // Update status
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      if (idempotencyKey) transaction.idempotencyKey = idempotencyKey;

      // Save all
      await user.save({ session });
      await vendor.save({ session });
      await transaction.save({ session });

      // 6. Log Action
      const AuditLog = (await import('../../models/auditLog.model.js')).default;
      await new AuditLog({
        action: 'COIN_REDEMPTION_COMPLETE',
        userId: transaction.userId,
        role: 'user',
        entityId: transaction._id,
        entityType: 'coin_transaction',
        actionType: 'update',
        severity: 'low',
        metadata: { vendorId: transaction.vendorId, coins: transaction.coins }
      }).save({ session });

      // Commit
      await session.commitTransaction();

      return {
        transactionId: transaction._id,
        coinsTransferred: transaction.coins,
        status: transaction.status
      };

    } catch (error) {
      await session.abortTransaction();
      console.error('[CoinsService Fulfillment Error]', error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }
}
