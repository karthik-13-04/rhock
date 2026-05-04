/**
 * PATCH /api/modules/ads/[id]/status
 * 
 * Admin approve or reject an ad
 */

import { dbConnect } from '../../../../../../config/database.js';
import { moderateAd } from '../../../../../../services/ad.service.js';
import { asyncHandler } from '../../../../../../utils/errorHandler.js';

export const PATCH = asyncHandler(async (req) => {
  await dbConnect();

  const url = new URL(req.url);
  const pathname = url.pathname;
  const segments = pathname.split('/').filter(Boolean);
  const adId = segments[segments.length - 2]; // [id] is before status

  const body = await req.json();
  const { action, notes } = body;
  const adminId = body.adminId || req.headers.get('x-admin-id');

  if (!adId) {
    return Response.json({
      success: false,
      error: { type: 'VALIDATION_ERROR', message: 'Ad ID is required' },
    }, { status: 400 });
  }

  if (!action || !['approve', 'reject'].includes(action)) {
    return Response.json({
      success: false,
      error: { type: 'VALIDATION_ERROR', message: 'Action must be "approve" or "reject"' },
    }, { status: 400 });
  }

  if (!adminId) {
    return Response.json({
      success: false,
      error: { type: 'AUTHENTICATION_ERROR', message: 'Admin ID is required' },
    }, { status: 401 });
  }

  const ad = await moderateAd(adId, action, adminId, notes);

  return Response.json({
    success: true,
    message: `Ad ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    data: {
      adId: ad._id,
      status: ad.status,
      reviewedAt: ad.reviewedAt,
    },
  });
});
