import { AuthController } from '@/modules/auth/auth.controller.js';

/**
 * Check if user exists by mobile number
 * Endpoint: POST /api/auth/check-user
 */
export async function POST(req) {
  return await AuthController.checkUser(req);
}
