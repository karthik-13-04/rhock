import { AuthController } from '@/modules/auth/auth.controller.js';

/**
 * Register a new user
 * Endpoint: POST /api/auth/register
 */
export async function POST(req) {
  return await AuthController.register(req);
}
