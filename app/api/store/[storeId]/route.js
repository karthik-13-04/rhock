import { StoreController } from '@/modules/store/store.controller.js';

/**
 * Store Details API
 * Endpoint: GET /api/store/:storeId
 */
export async function GET(req, { params }) {
  return await StoreController.getStoreDetails(req, { params });
}
