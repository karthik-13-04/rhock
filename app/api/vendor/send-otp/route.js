import { VendorController } from '@/modules/vendor/vendor.controller.js';

/**
 * POST /api/vendor/send-otp
 * Sends OTP to a vendor's mobile number
 */
export async function POST(req) {
  return await VendorController.sendOtp(req);
}
