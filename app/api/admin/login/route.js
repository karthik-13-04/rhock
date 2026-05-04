import { AdminController } from '@/modules/admin/admin.controller.js';

/**
 * POST /api/admin/login
 * Admin authentication (Email/Password)
 */
export async function POST(req) {
  return await AdminController.login(req);
}
