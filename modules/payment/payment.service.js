import Payment from '../../models/payment.model.js';
import Plan from '../../models/plan.model.js';
import Subscription from '../../models/subscription.model.js';
import { razorpayService } from '../../services/razorpay.service.js';
import mongoose from 'mongoose';

/**
 * Payment Service
 */
export class PaymentService {
  /**
   * Initiate a subscription payment order
   * @param {string} vendorId 
   * @param {string} planId 
   */
  static async initiateSubscriptionPayment(vendorId, planId) {
    // 1. Fetch the requested plan
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      throw new Error('Invalid or inactive plan selecion');
    }

    // 2. Calculate amount (ensure it's in paise)
    const amountInPaise = Math.round(plan.price * 100);

    // 3. Create order in Razorpay
    let razorOrder;
    try {
      razorOrder = await razorpayService.createOrder(amountInPaise);
    } catch (error) {
      throw error; // Re-throw with service message
    }

    // 4. Save payment audit record
    const payment = new Payment({
      vendorId,
      planId,
      razorpayOrderId: razorOrder.id,
      amount: amountInPaise,
      status: 'created'
    });

    await payment.save();

    return {
      order: razorOrder,
      plan: {
        name: plan.name,
        credits: plan.credits
      }
    };
  }

  /**
   * Fulfill a subscription after payment confirmation
   * This is called by both the verification API and the Webhook
   * @param {string} orderId 
   * @param {string} paymentId 
   * @param {string} signature (Optional for webhooks)
   * @param {string} idempotencyKey (Optional)
   */
  static async fulfillSubscription(orderId, paymentId, signature = null, idempotencyKey = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Find Payment record
      const payment = await Payment.findOne({ razorpayOrderId: orderId }).session(session);

      if (!payment) {
        throw new Error('Payment record not found');
      }

      // 2. Idempotency Check (by key or status)
      if (payment.status === 'paid' || (idempotencyKey && payment.idempotencyKey === idempotencyKey)) {
        await session.commitTransaction(); // Already done, just return
        return { alreadyProcessed: true };
      }

      // 3. Get Plan details
      const plan = await Plan.findById(payment.planId).session(session);
      if (!plan) {
        throw new Error('Associated plan not found');
      }

      // 4. Update Payment record
      payment.status = 'paid';
      payment.razorpayPaymentId = paymentId;
      if (signature) payment.razorpaySignature = signature;
      if (idempotencyKey) payment.idempotencyKey = idempotencyKey;
      await payment.save({ session });

      // 5. Create or Update Subscription
      let subscription = await Subscription.findOne({ vendorId: payment.vendorId }).session(session);
      const now = new Date();

      if (!subscription) {
        const expiryDate = new Date(now.getTime() + plan.validityDays * 24 * 60 * 60 * 1000);
        subscription = new Subscription({
          vendorId: payment.vendorId,
          planId: plan._id,
          creditsTotal: plan.credits,
          creditsUsed: 0,
          startDate: now,
          expiryDate: expiryDate
        });
      } else {
        subscription.creditsTotal += plan.credits;
        const baseDate = subscription.expiryDate > now ? subscription.expiryDate : now;
        subscription.expiryDate = new Date(baseDate.getTime() + plan.validityDays * 24 * 60 * 60 * 1000);
        subscription.planId = plan._id;
      }

      await subscription.save({ session });

      // 6. Log Action
      const AuditLog = (await import('../../models/auditLog.model.js')).default;
      await new AuditLog({
        action: 'PAYMENT_FULFILLMENT',
        userId: payment.vendorId,
        role: 'vendor',
        entityId: payment._id,
        entityType: 'payment',
        actionType: 'update',
        severity: 'medium',
        metadata: { orderId, paymentId, planId: plan._id }
      }).save({ session });

      await session.commitTransaction();

      return {
        planName: plan.name,
        creditsTotal: subscription.creditsTotal,
        creditsUsed: subscription.creditsUsed,
        expiryDate: subscription.expiryDate
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Verify Razorpay payment and fulfill subscription activation
   * @param {string} vendorId 
   * @param {Object} verificationData { orderId, paymentId, signature }
   * @param {string} idempotencyKey (Optional)
   */
  static async verifyAndActivateSubscription(vendorId, { orderId, paymentId, signature }, idempotencyKey = null) {
    // 1. Verify Signature locally
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const { validatePaymentVerification } = await import('razorpay/dist/utils/razorpay-utils.js');
    
    const isValid = validatePaymentVerification(
      { order_id: orderId, payment_id: paymentId },
      signature,
      secret
    );

    if (!isValid) {
      throw new Error('Payment verification failed: Invalid signature');
    }

    // 2. Delegate to fulfillment logic
    return await this.fulfillSubscription(orderId, paymentId, signature, idempotencyKey);
  }
}
