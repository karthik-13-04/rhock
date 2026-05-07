import { AdminController } from "@/modules/admin/admin.controller.js";

/**
 * GET /api/admin/ads
 * Admin lists ads with optional status filter
 */
export async function GET(req) {
  return await AdminController.getAds(req);
}
