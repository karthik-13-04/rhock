import { AdsController } from '../../../../modules/ads/ads.controller.js';

/**
 * GET /api/ads/vendor
 * Fetches all ads for the authenticated vendor
 */
export async function GET(req) {
  return await AdsController.getVendorAdsByToken(req);
}
