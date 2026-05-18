import { AdminController } from '@/modules/admin/admin.controller.js';

/**
 * POST /api/admin/vendors/restore
 * Handles vendor restoration by admin
 */
export async function POST(req) {
  return await AdminController.restoreVendor(req);
}
