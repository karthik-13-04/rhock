import { AdminController } from '../../../../../../modules/admin/admin.controller.js';

/**
 * PUT /api/admin/ads/review/[adId]
 * Entry point for administrators to approve or reject advertisements
 */
export async function PUT(req, { params }) {
  return await AdminController.reviewAd(req, { params });
}
