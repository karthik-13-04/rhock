/**
 * POST /api/modules/cron
 * 
 * Maintenance tasks triggered by a scheduled job:
 * 1. Expire old ads
 * 2. Expire old subscriptions
 */

import { dbConnect } from '../../../../config/database.js';
import { expireOldAds } from '../../../../services/ad.service.js';
import { expireOldSubscriptions } from '../../../../services/subscription.service.js';
import { asyncHandler } from '../../../../utils/errorHandler.js';

export const POST = asyncHandler(async (req) => {
  await dbConnect();

  // Basic security: check for a cron secret if provided in environment
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({
      success: false,
      error: { type: 'AUTHENTICATION_ERROR', message: 'Unauthorized cron trigger' },
    }, { status: 401 });
  }

  const expiredAdsCount = await expireOldAds();
  const expiredSubscriptionsCount = await expireOldSubscriptions();

  return Response.json({
    success: true,
    message: 'Maintenance tasks completed successfully',
    data: {
      expiredAdsCount,
      expiredSubscriptionsCount,
      timestamp: new Date().toISOString(),
    },
  });
});
