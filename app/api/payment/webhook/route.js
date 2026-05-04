import crypto from 'crypto';
import { dbConnect } from '@/config/database';
import { PaymentService } from '@/modules/payment/payment.service';
import { logger } from '@/utils/logger';

/**
 * POST /api/payment/webhook
 * Enterprise-grade handler for Razorpay payment events
 */
export async function POST(req) {
  const requestId = crypto.randomUUID();
  
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      logger.error('RAZORPAY_WEBHOOK_SECRET is missing in environment');
      return Response.json({ success: false, message: 'Configuration error' }, { status: 500 });
    }

    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
      logger.warn('Webhook received without signature', { requestId });
      return Response.json({ success: false, message: 'Missing signature' }, { status: 400 });
    }

    // Capture RAW body for signature verification
    const rawBody = await req.text();

    // 1. Verify Signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.security('Invalid Razorpay webhook signature detected', { 
        requestId,
        receivedSignature: signature,
        ip: req.headers.get('x-forwarded-for')
      });
      return Response.json({ success: false, message: 'Invalid signature' }, { status: 400 });
    }

    const body = JSON.parse(rawBody);
    logger.info(`Webhook event received: ${body.event}`, { requestId, eventId: body.id });

    // 2. Handle payment.captured (Fulfillment Logic)
    if (body.event === 'payment.captured') {
      const paymentEntity = body.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      await dbConnect();

      // Delegate to service for fulfillment and idempotency check
      const result = await PaymentService.fulfillSubscription(orderId, paymentId);

      if (result.alreadyProcessed) {
        logger.info(`Webhook idempotency: Order ${orderId} already processed.`, { requestId });
      } else {
        logger.info(`Webhook fulfillment success: Order ${orderId}`, { requestId, plan: result.planName });
      }
    }

    // Always return 200 to Razorpay to prevent retry loops on success
    return Response.json({ success: true, requestId });

  } catch (error) {
    logger.error('Critical Webhook Processing Failure', error, { requestId });
    return Response.json({ success: false, message: 'Internal processing error' }, { status: 500 });
  }
}
