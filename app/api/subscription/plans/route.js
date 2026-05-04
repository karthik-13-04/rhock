import { SubscriptionController } from '../../../../modules/subscription/subscription.controller.js';

/**
 * GET /api/subscription/plans
 * Entry point for fetching available vendor subscription schemes
 */
export async function GET(req) {
  return await SubscriptionController.getPlans(req);
}
