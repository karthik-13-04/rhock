import { AdminController } from "@/modules/admin/admin.controller.js";

/**
 * GET /api/admin/dashboard/analytics
 * Platform trends and growth data
 */
export async function GET(req) {
  return await AdminController.getAnalytics(req);
}
