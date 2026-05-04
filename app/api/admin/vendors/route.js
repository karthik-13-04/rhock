import { AdminController } from "@/modules/admin/admin.controller.js";

/**
 * GET /api/admin/vendors
 * Fetch vendor listings with filters
 */
export async function GET(req) {
  return await AdminController.getVendors(req);
}
