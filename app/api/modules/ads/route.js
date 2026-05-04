/**
 * POST /api/modules/ads      — Create new ad (deducts credits)
 * GET  /api/modules/ads       — List ads (public: approved only, auth user: own ads)
 */

import { dbConnect } from '../../../../config/database.js';
import { createAd, listAds } from '../../../../services/ad.service.js';
import { asyncHandler } from '../../../../utils/errorHandler.js';

// ==========================================
// GET — List ads
// ==========================================
export const GET = asyncHandler(async (req) => {
  await dbConnect();

  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const userId = req.headers.get('x-user-id');

  const result = await listAds(query, page, limit, userId);

  return Response.json({
    success: true,
    message: 'Ads fetched successfully',
    data: result,
  });
});

// ==========================================
// POST — Create ad
// ==========================================
export const POST = asyncHandler(async (req) => {
  await dbConnect();

  const body = await req.json();
  const userId = body.userId || req.headers.get('x-user-id');

  if (!userId) {
    return Response.json({
      success: false,
      error: { type: 'AUTHENTICATION_ERROR', message: 'User ID is required' },
    }, { status: 401 });
  }

  const result = await createAd(body, userId);

  return Response.json({
    success: true,
    message: 'Ad created successfully. Pending admin approval.',
    data: result,
  });
});
