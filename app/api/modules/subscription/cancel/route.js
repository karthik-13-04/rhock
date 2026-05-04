/**
 * POST /api/modules/subscription/cancel
 * 
 * Cancel user's active subscription
 */

import { dbConnect } from '../../../../../config/database.js';
import { cancelSubscription } from '../../../../../services/subscription.service.js';
import { asyncHandler } from '../../../../../utils/errorHandler.js';

export const POST = asyncHandler(async (req) => {
  await dbConnect();

  const body = await req.json();
  const userId = body.userId || req.headers.get('x-user-id');
  const reason = body.reason || '';

  if (!userId) {
    return Response.json({
      success: false,
      error: { type: 'AUTHENTICATION_ERROR', message: 'User ID is required' },
    }, { status: 401 });
  }

  const subscription = await cancelSubscription(userId, reason);

  return Response.json({
    success: true,
    message: 'Subscription cancelled successfully',
    data: {
      subscriptionId: subscription._id,
      status: subscription.status,
      cancelledAt: subscription.cancelledAt,
      creditsRemaining: subscription.creditsRemaining,
    },
  });
});
