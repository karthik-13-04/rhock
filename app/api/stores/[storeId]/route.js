import { StoreController } from '../../../../modules/store/store.controller.js';

/**
 * Public API for fetching store details and its approved deals
 * Endpoint: GET /api/stores/[storeId]
 */
export async function GET(req, { params }) {
  return await StoreController.getStoreDetails(req, { params });
}
