import { CoinsService } from './coins.service.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { strictLimiter } from '../../middleware/rateLimiter.js';
import { dbConnect } from '../../config/database.js';

/**
 * Coins Controller
 */
export class CoinsController {
  /**
   * POST /api/coins/initiate
   * Initiates a coin redemption request from a user
   */
  static async initiate(req) {
    try {
      // Apply Rate Limiting
      const limitError = await strictLimiter(req);
      if (limitError) return limitError;

      // 1. Ensure DB connection
      await dbConnect();

      // 2. Validate JWT and Role
      const { user: vendorUser, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(vendorUser, ['vendor']);
      if (roleError) return roleError;

      // 3. Extract and Validate Body
      const body = await req.json();
      const { referralCode, coins, latitude, longitude } = body;

      if (!referralCode) {
        return Response.json({ success: false, message: 'User Referral Code is required' }, { status: 400 });
      }

      if (!coins || coins <= 0) {
        return Response.json({ success: false, message: 'Coin amount must be greater than 0' }, { status: 400 });
      }

      if (latitude === undefined || longitude === undefined) {
        return Response.json({ success: false, message: 'Geospatial coordinates are required for redemption' }, { status: 400 });
      }

      // 4. Extract Vendor instance
      const Vendor = (await import('../../models/vendor.model.js')).default;
      const vendor = await Vendor.findOne({ userId: vendorUser.id });
      if (!vendor) {
        return Response.json({ success: false, message: 'Vendor profile not found' }, { status: 404 });
      }

      // 5. Initiate Transaction via Service
      const result = await CoinsService.initiateRedemption(vendor._id, referralCode, coins, { latitude, longitude });

      // 6. Success Response
      return Response.json({
        success: true,
        message: 'User validated. Proceed to OTP',
        user: result.user,
        transactionId: result.transactionId
      }, { status: 201 });

    } catch (error) {
      console.error('[CoinsController Initiate Error]', error);
      
      // Handle known service errors
      const status = error.message.includes('not found') ? 404 : 400;
      
      return Response.json({
        success: false,
        message: error.message || 'Internal server error'
      }, { status });
    }
  }

  /**
   * POST /api/coins/send-otp
   * Generates and sends a hashed OTP to the user
   */
  static async sendOtp(req) {
    try {
      // Apply Rate Limiting
      const limitError = await strictLimiter(req);
      if (limitError) return limitError;

      // 1. Ensure DB connection
      await dbConnect();

      // 2. Validate JWT and Role
      const { user: vendorUser, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(vendorUser, ['vendor']);
      if (roleError) return roleError;

      // 3. Extract and Validate Body
      const body = await req.json();
      const { transactionId } = body;

      if (!transactionId) {
        return Response.json({ success: false, message: 'Transaction ID is required' }, { status: 400 });
      }

      // 4. Extract Vendor instance
      const Vendor = (await import('../../models/vendor.model.js')).default;
      const vendor = await Vendor.findOne({ userId: vendorUser.id });
      if (!vendor) {
        return Response.json({ success: false, message: 'Vendor profile not found' }, { status: 404 });
      }

      // 5. Send OTP via Service
      await CoinsService.sendOtpToUser(vendor._id, transactionId);

      // 6. Success Response
      return Response.json({
        success: true,
        message: 'OTP sent successfully'
      }, { status: 200 });

    } catch (error) {
      console.error('[CoinsController SendOtp Error]', error);
      
      const status = error.message.includes('not found') ? 404 : 400;

      return Response.json({
        success: false,
        message: error.message || 'Internal server error'
      }, { status });
    }
  }

  /**
   * POST /api/coins/verify
   * Verifies OTP and completes the coin redemption
   */
  static async verify(req) {
    try {
      // Apply Rate Limiting
      const limitError = await strictLimiter(req);
      if (limitError) return limitError;

      // 1. Ensure DB connection
      await dbConnect();

      // 2. Validate JWT and Role
      const { user: vendorUser, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(vendorUser, ['vendor']);
      if (roleError) return roleError;

      // 3. Extract and Validate Body
      const body = await req.json();
      const { transactionId, otp } = body;
      const idempotencyKey = req.headers.get('x-idempotency-key');

      if (!transactionId || !otp) {
        return Response.json({ success: false, message: 'Transaction ID and OTP are required' }, { status: 400 });
      }

      // 4. Extract Vendor instance
      const Vendor = (await import('../../models/vendor.model.js')).default;
      const vendor = await Vendor.findOne({ userId: vendorUser.id });
      if (!vendor) {
        return Response.json({ success: false, message: 'Vendor profile not found' }, { status: 404 });
      }

      // 5. Verify and Complete via Service
      const result = await CoinsService.verifyAndCompleteRedemption(vendor._id, transactionId, otp, idempotencyKey);

      // 6. Success Response
      return Response.json({
        success: true,
        message: 'Transaction completed successfully',
        transaction: result
      }, { status: 200 });

    } catch (error) {
      console.error('[CoinsController Verify Error]', error);
      
      // Determine appropriate status code
      let status = 400;
      if (error.message.includes('not found')) status = 404;
      if (error.message.includes('Authentication')) status = 401;

      return Response.json({
        success: false,
        message: error.message || 'Internal server error'
      }, { status });
    }
  }
}
