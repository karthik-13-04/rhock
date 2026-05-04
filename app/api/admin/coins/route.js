import { AdminController } from "@/modules/admin/admin.controller.js";

export async function GET(req) {
  return await AdminController.getCoinTransactions(req);
}
