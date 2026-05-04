import { AdsController } from '../../../../../modules/ads/ads.controller.js';

/**
 * PUT /api/ads/edit/[adId]
 * Entry point for vendors to update their advertisement listings
 */
export async function PUT(req, { params }) {
  return await AdsController.editAd(req, { params });
}
