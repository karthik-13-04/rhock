import { VendorController } from '../../../../../modules/vendor/vendor.controller.js';

/**
 * POST /api/vendor/register/step-3
 * Entry point for Final Submission of Vendor Registration (Localization + Agent)
 */
export async function POST(req) {
  return await VendorController.registerStep3(req);
}
