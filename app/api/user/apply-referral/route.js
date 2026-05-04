import { UserController } from '@/modules/user/user.controller.js';

/**
 * Apply Referral Code and Reward Coins
 * Endpoint: POST /api/user/apply-referral
 * Access: Required (JWT Token), Role = user
 */
export async function POST(req) {
  return await UserController.applyReferral(req);
}
