import { VendorController } from '../../../../modules/vendor/vendor.controller.js';

export async function GET(req) {
  return await VendorController.getProfile(req);
}

export async function PATCH(req) {
  return await VendorController.updateProfile(req);
}
