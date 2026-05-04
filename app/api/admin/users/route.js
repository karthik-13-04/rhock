import { AdminController } from "@/modules/admin/admin.controller.js";

/**
 * GET /api/admin/users
 */
export async function GET(req) {
  return await AdminController.getUsers(req);
}
