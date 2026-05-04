import { DealController } from '@/modules/deal/deal.controller.js';

/**
 * GET /api/deals
 * Public: List all approved vendor offers (deals)
 */
export async function GET(req) {
  return await DealController.getDeals(req);
}
