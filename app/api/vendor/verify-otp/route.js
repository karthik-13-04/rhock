import { VendorController } from '@/modules/vendor/vendor.controller.js';

/**
 * POST /api/vendor/verify-otp
 * Verifies OTP and returns a JWT token for the vendor
 */
export async function POST(req) {
  return await VendorController.verifyOtp(req);
}
