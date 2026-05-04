import { VendorController } from '../../../../../modules/vendor/vendor.controller.js';

/**
 * POST /api/vendor/register/step-1
 * Entry point for Step 1 of Vendor Registration
 */
export async function POST(req) {
  return await VendorController.registerStep1(req);
}
