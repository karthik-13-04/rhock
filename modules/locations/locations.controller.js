import locationData from '../../utils/locationData.js';

/**
 * Locations Controller
 * Handles master-data for locations (States, Districts, Mandals)
 */
export class LocationsController {
  /**
   * GET /api/locations/tree
   * Returns a hierarchical tree of states, districts, and mandals
   */
  static async getLocationTree(req) {
    try {
      // Format the data as requested by the app
      const tree = Object.entries(locationData).map(([stateName, districts]) => ({
        name: stateName,
        districts: Object.entries(districts).map(([districtName, mandals]) => ({
          name: districtName,
          mandals: mandals
        }))
      }));

      return Response.json({
        success: true,
        data: tree
      }, { status: 200 });

    } catch (error) {
      console.error('[LocationsController.getLocationTree Error]', error);
      return Response.json({
        success: false,
        message: 'Failed to fetch location tree'
      }, { status: 500 });
    }
  }
}
