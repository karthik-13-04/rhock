import { UserController } from '@/modules/user/user.controller.js';

/**
 * Get logged-in user profile details
 * Endpoint: GET /api/user/profile
 * Access: Required (JWT Token), Role = user
 */
export async function GET(req) {
  return await UserController.getProfile(req);
}
