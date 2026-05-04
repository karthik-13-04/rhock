import { AdminController } from "@/modules/admin/admin.controller.js";

/**
 * PATCH /api/admin/vendors/[id]
 * Process vendor approvals or rejections
 */
export async function PATCH(req, { params }) {
  return await AdminController.updateVendorStatus(req, { params });
}
