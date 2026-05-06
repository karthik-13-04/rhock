import { LocationsController } from '../../../../modules/locations/locations.controller.js';

/**
 * Public API for fetching the location hierarchy
 * Endpoint: GET /api/locations/tree
 */
export async function GET(req) {
  return await LocationsController.getLocationTree(req);
}
