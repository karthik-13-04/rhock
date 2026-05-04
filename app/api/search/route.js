import { StoreController } from '@/modules/store/store.controller.js';

/**
 * Universal Search API (Alias for stores search)
 * Endpoint: GET /api/search
 */
export async function GET(req) {
  return await StoreController.searchStores(req);
}
