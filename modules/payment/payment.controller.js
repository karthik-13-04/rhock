import { PaymentService } from './payment.service.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { paymentLimiter } from '../../middleware/rateLimiter.js';
import { dbConnect } from '../../config/database.js';
import Vendor from '../../models/vendor.model.js';

/**
 * Payment Controller
 */
export class PaymentController {
  /**
   * POST /api/payment/create-order
   * Initiates the subscription purchase flow
   */
  static async createOrder(req) {
    try {
      // 1. Ensure DB connection
      await dbConnect();

      // Apply Rate Limiting
      const limitError = await paymentLimiter(req);
      if (limitError) return limitError;

      // 2. Validate JWT and Role
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['vendor']);
      if (roleError) return roleError;

      // 3. Find Vendor and check status
      const vendor = await Vendor.findOne({ userId: user.id });
      if (!vendor) {
        return Response.json({ success: false, message: 'Vendor profile not found' }, { status: 404 });
      }

      if (vendor.status === 'suspended') {
        return Response.json({ 
          success: false, 
          message: 'Access Denied. Your vendor account is currently suspended.' 
        }, { status: 403 });
      }

      if (vendor.status !== 'active') {
        return Response.json({ 
          success: false, 
          message: 'Your vendor account is not yet verified. Administrative approval is required before purchasing subscriptions.' 
        }, { status: 403 });
      }

      // 4. Extract Body
      const body = await req.json();
      const { planId } = body;

      if (!planId) {
        return Response.json({ success: false, message: 'Plan selection is required' }, { status: 400 });
      }

      // 5. Create Order via Service
      const result = await PaymentService.initiateSubscriptionPayment(vendor._id, planId);

      // 6. Success Response
      return Response.json({
        success: true,
        order: result.order,
        plan: result.plan
      }, { status: 201 });

    } catch (error) {
      console.error('[PaymentController CreateOrder Error]', error);
      
      const status = error.message.includes('Invalid') ? 400 : 500;
      
      return Response.json({
        success: false,
        message: error.message || 'Internal server error'
      }, { status });
    }
  }

  /**
   * POST /api/payment/verify
   * Verifies Razorpay payment and activates subscription
   */
  static async verifyPayment(req) {
    try {
      // 1. Ensure DB connection
      await dbConnect();

      // 2. Validate JWT and Role
      const { user, error: authError } = await authenticate(req);
      if (authError) return authError;

      const roleError = authorize(user, ['vendor']);
      if (roleError) return roleError;

      // 3. Extract Body
      const body = await req.json();
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      const idempotencyKey = req.headers.get('x-idempotency-key');

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return Response.json({ success: false, message: 'Missing verification details' }, { status: 400 });
      }

      // 4. Verify and Activate via Service
      const result = await PaymentService.verifyAndActivateSubscription(user.id, {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature
      }, idempotencyKey);

      // 5. Success Response
      return Response.json({
        success: true,
        message: 'Payment verified and subscription activated',
        subscription: result
      }, { status: 200 });

    } catch (error) {
      console.error('[PaymentController Verify Error]', error);
      
      const status = error.message.includes('failed') || error.message.includes('not found') ? 400 : 500;

      return Response.json({
        success: false,
        message: error.message || 'Internal server error'
      }, { status });
    }
  }
}
