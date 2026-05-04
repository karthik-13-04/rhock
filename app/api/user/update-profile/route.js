import { UserController } from '@/modules/user/user.controller.js';

/**
 * Update User Profile (Onboarding)
 * Endpoint: PUT /api/user/update-profile
 */
export async function PUT(req) {
  return await UserController.updateProfile(req);
}
