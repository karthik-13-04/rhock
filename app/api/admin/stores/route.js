import { AdminController } from '@/modules/admin/admin.controller.js';

/**
 * GET /api/admin/stores
 * Admin: List all stores
 */
export async function GET(req) {
  return await AdminController.getStores(req);
}
