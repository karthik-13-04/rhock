import { VendorController } from '@/modules/vendor/vendor.controller.js';

/**
 * POST /api/vendor/check-vendor
 * Checks if a vendor exists by mobile number
 */
export async function POST(req) {
  return await VendorController.checkVendor(req);
}
