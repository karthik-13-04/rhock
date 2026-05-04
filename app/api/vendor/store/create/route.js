import { VendorController } from '@/modules/vendor/vendor.controller.js';

/**
 * POST /api/vendor/store/create
 * Vendor Creates Store
 */
export async function POST(req) {
  return await VendorController.createStore(req);
}
