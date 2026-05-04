import { SubscriptionController } from '../../../../modules/subscription/subscription.controller.js';

/**
 * GET /api/subscription/current
 * Entry point for vendors to view their active subscription and credit balance
 */
export async function GET(req) {
  return await SubscriptionController.getCurrentSubscription(req);
}
