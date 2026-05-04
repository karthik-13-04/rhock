import { AdminController } from '@/modules/admin/admin.controller.js';

/**
 * PUT /api/admin/store/review/[storeId]
 * Admin: Approve or Reject a vendor store
 */
export async function PUT(req, { params }) {
  return await AdminController.reviewStore(req, { params });
}
