/**
 * POST /api/modules/payment/create-order
 * 
 * Create a Razorpay payment order
 */

import { dbConnect } from '../../../../../config/database.js';
import { createOrder } from '../../../../../services/razorpay.service.js';
import { asyncHandler } from '../../../../../utils/errorHandler.js';

export const POST = asyncHandler(async (req) => {
  await dbConnect();

  const body = await req.json();
  const { amount, currency, purpose, subscriptionPlanId, notes } = body;
  const userId = body.userId || req.headers.get('x-user-id');

  if (!userId) {
    return Response.json({
      success: false,
      error: { type: 'AUTHENTICATION_ERROR', message: 'User ID is required' },
    }, { status: 401 });
  }

  if (!amount || amount <= 0) {
    return Response.json({
      success: false,
      error: { type: 'VALIDATION_ERROR', message: 'Amount is required and must be > 0' },
    }, { status: 400 });
  }

  if (!purpose) {
    return Response.json({
      success: false,
      error: { type: 'VALIDATION_ERROR', message: 'Purpose is required (subscription/top_up/ad_credits)' },
    }, { status: 400 });
  }

  const result = await createOrder(
    { amount, currency, purpose, subscriptionPlanId, notes },
    userId
  );

  return Response.json({
    success: true,
    message: 'Payment order created',
    data: {
      orderId: result.order.id,
      amount: result.order.amount,
      currency: result.order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      receipt: result.order.receipt,
      payment: result.payment,
      subscription: result.subscription || null,
    },
  });
});
