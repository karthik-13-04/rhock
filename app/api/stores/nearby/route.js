import { StoreController } from '@/modules/store/store.controller.js';

/**
 * GET /api/stores/nearby
 * Public discovery endpoint
 */
export async function GET(req) {
  return await StoreController.getNearby(req);
}
