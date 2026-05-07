import { VendorController } from "@/modules/vendor/vendor.controller.js";

/**
 * GET /api/vendor/ads
 * Vendor lists their own ads
 */
export async function GET(req) {
  return await VendorController.getAds(req);
}

/**
 * POST /api/vendor/ads
 * Vendor creates a new ad (deducts 1 credit)
 */
export async function POST(req) {
  return await VendorController.createAd(req);
}
