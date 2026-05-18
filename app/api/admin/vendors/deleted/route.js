import { AdminController } from '@/modules/admin/admin.controller.js';

/**
 * GET /api/admin/vendors/deleted
 * Returns list of soft-deleted vendors
 */
export async function GET(req) {
  return await AdminController.getDeletedVendors(req);
}
