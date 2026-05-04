import { AuthController } from '@/modules/auth/auth.controller.js';

export async function POST(req) {
  return AuthController.sendOtp(req);
}
