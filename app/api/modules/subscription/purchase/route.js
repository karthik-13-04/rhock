/**
 * POST /api/modules/subscription/purchase
 * 
 * Purchase a subscription plan
 * Allocates credits to user's wallet
 */

import { dbConnect } from '../../../../../config/database.js';
import { purchaseSubscription } from '../../../../../services/subscription.service.js';
import { asyncHandler } from '../../../../../utils/errorHandler.js';

export const POST = asyncHandler(async (req) => {
  await dbConnect();

  const body = await req.json();
  const { planId, paymentMethod, paymentInfo } = body;
  const userId = body.userId || req.headers.get('x-user-id');

  if (!userId) {
    return Response.json({
      success: false,
      error: { type: 'AUTHENTICATION_ERROR', message: 'User ID is required' },
    }, { status: 401 });
  }

  if (!planId) {
    return Response.json({
      success: false,
      error: { type: 'VALIDATION_ERROR', message: 'Plan ID or slug is required' },
    }, { status: 400 });
  }

  const method = paymentMethod || 'razorpay';

  const result = await purchaseSubscription(userId, planId, method, paymentInfo || {});

  const message = method === 'trial'
    ? 'Trial subscription activated'
    : method === 'credits'
      ? 'Subscription purchased using credits'
      : method === 'admin_grant'
        ? 'Subscription granted by admin'
        : 'Subscription created. Complete payment to activate.';

  return Response.json({
    success: true,
    message,
    data: {
      subscription: result.subscription,
      creditsAllocated: result.creditsAllocated,
      userCoinBalance: result.userCoinBalance,
    },
  });
});
