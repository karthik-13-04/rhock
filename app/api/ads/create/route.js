import { AdsController } from '../../../../modules/ads/ads.controller.js';

/**
 * POST /api/ads/create
 * Entry point for vendors to create new advertisements
 */
export async function POST(req) {
  return await AdsController.createAd(req);
}
