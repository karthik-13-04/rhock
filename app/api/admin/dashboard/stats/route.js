import { AdminController } from "@/modules/admin/admin.controller.js";

/**
 * GET /api/admin/dashboard/stats
 * Real-time platform metrics
 */
export async function GET(req) {
  return await AdminController.getDashboardStats(req);
}
