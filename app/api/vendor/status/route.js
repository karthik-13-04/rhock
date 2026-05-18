import { VendorController } from '@/modules/vendor/vendor.controller.js';

/**
 * GET /api/vendor/status
 * Fetches current vendor account status and metadata
 */
export async function GET(req) {
  return await VendorController.getStatus(req);
}
