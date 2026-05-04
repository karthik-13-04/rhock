import { UserController } from '@/modules/user/user.controller.js';

/**
 * Update User Profile (Onboarding)
 * Endpoint: PUT /api/user/update-profile
 */
export const runtime = 'nodejs'; // Ensure Node.js runtime for proper multipart file handling

export async function PUT(req) {
  return await UserController.updateProfile(req);
}
