/**
 * GET /api/modules/subscription/my
 * 
 * Get user's currently active subscription
 */

import { dbConnect } from '../../../../../config/database.js';
import { getActiveSubscription, getUserSubscriptions } from '../../../../../services/subscription.service.js';
import { asyncHandler } from '../../../../../utils/errorHandler.js';

export const GET = asyncHandler(async (req) => {
  await dbConnect();

  const url = new URL(req.url);
  const all = url.searchParams.get('all') === 'true';
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 10;

  const userId = req.headers.get('x-user-id');

  if (!userId) {
    return Response.json({
      success: false,
      error: { type: 'AUTHENTICATION_ERROR', message: 'User ID is required' },
    }, { status: 401 });
  }

  if (all) {
    // Get all subscriptions (paginated)
    const result = await getUserSubscriptions(userId, page, limit);

    return Response.json({
      success: true,
      message: 'All subscriptions fetched',
      data: result,
    });
  }

  // Get only active subscription
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    return Response.json({
      success: true,
      message: 'No active subscription',
      data: null,
    });
  }

  return Response.json({
    success: true,
    message: 'Active subscription fetched',
    data: {
      subscription,
      isCurrentlyActive: subscription.isCurrentlyActive,
      daysRemaining: subscription.daysRemaining,
      creditsRemaining: subscription.creditsRemaining,
      creditUsagePercentage: subscription.creditUsagePercentage,
    },
  });
});
