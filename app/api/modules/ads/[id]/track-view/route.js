/**
 * POST /api/modules/ads/[id]/track-view
 * 
 * Track an ad view (deduplicated per viewer within 24h)
 */

import { dbConnect } from '../../../../../../config/database.js';
import { trackAdView } from '../../../../../../services/ad.service.js';
import { asyncHandler } from '../../../../../../utils/errorHandler.js';

export const POST = asyncHandler(async (req) => {
  await dbConnect();

  const url = new URL(req.url);
  const pathname = url.pathname;
  const segments = pathname.split('/').filter(Boolean);
  const adId = segments[segments.length - 2]; // [id] is before track-view

  const viewerId = req.headers.get('x-forwarded-for') ||
                   req.headers.get('x-real-ip') ||
                   req.headers.get('x-viewer-id') ||
                   'unknown';

  if (!adId) {
    return Response.json({
      success: false,
      error: { type: 'VALIDATION_ERROR', message: 'Ad ID is required' },
    }, { status: 400 });
  }

  const result = await trackAdView(adId, viewerId);

  return Response.json({
    success: true,
    message: 'View tracked',
    data: result,
  });
});
