import { CoinsController } from '@/modules/coins/coins.controller.js';

/**
 * POST /api/coins/initiate
 * Entry point for vendors to initiate a coin redemption from a user
 */
export async function POST(req) {
  return await CoinsController.initiate(req);
}
