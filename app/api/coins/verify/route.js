import { CoinsController } from '@/modules/coins/coins.controller.js';

/**
 * POST /api/coins/verify
 * Entry point for vendors to verify the user-provided OTP and finalize the coin redemption transfer
 */
export async function POST(req) {
  return await CoinsController.verify(req);
}
