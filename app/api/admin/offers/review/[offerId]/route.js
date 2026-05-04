import { AdminController } from '@/modules/admin/admin.controller.js';

/**
 * PUT /api/admin/offers/review/[offerId]
 * Admin: Approve or Reject a vendor offer
 */
export async function PUT(req, { params }) {
  return await AdminController.reviewOffer(req, { params });
}
