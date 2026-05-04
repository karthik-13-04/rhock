import { CoinsController } from '@/modules/coins/coins.controller.js';

/**
 * POST /api/coins/send-otp
 * Entry point for vendors to trigger an OTP dispatch to a user for redemption confirmation
 */
export async function POST(req) {
  return await CoinsController.sendOtp(req);
}
