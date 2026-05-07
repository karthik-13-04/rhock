import { VendorController } from "@/modules/vendor/vendor.controller.js";

/**
 * GET /api/vendor/ads/:id
 * Fetch single ad
 */
export async function GET(req, { params }) {
  return await VendorController.getAd(req, { params });
}

/**
 * PATCH /api/vendor/ads/:id
 * Update ad
 */
export async function PATCH(req, { params }) {
  return await VendorController.updateAd(req, { params });
}

/**
 * DELETE /api/vendor/ads/:id
 * Delete ad
 */
export async function DELETE(req, { params }) {
  return await VendorController.deleteAd(req, { params });
}
