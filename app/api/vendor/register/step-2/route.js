import { VendorController } from '../../../../../modules/vendor/vendor.controller.js';

/**
 * POST /api/vendor/register/step-2
 * Entry point for Step 2 of Vendor Registration (Business Details + Media)
 */
export async function POST(req) {
  return await VendorController.registerStep2(req);
}
