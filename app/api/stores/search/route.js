import { StoreController } from '../../../../modules/store/store.controller.js';

/**
 * Discovery Engine: Search and filter stores
 * Endpoint: GET /api/stores/search
 */
export async function GET(req) {
  return await StoreController.searchStores(req);
}
