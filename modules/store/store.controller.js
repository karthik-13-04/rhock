import { StoreService } from '@/modules/store/store.service.js';
import { dbConnect } from '@/config/database.js';

/**
 * Store Controller
 * Handles requests for public store profile viewing
 */
export class StoreController {
  /**
   * GET /api/stores/:storeId
   * Public endpoint to get store profile and its deals
   */
  static async getStoreDetails(req, { params }) {
    try {
      // 1. Ensure Database Connection
      await dbConnect();

      // 2. Extract storeId from URL parameters
      const { storeId } = await params;

      if (!storeId) {
        return Response.json({ 
          success: false, 
          message: 'Store ID is required' 
        }, { status: 400 });
      }

      // 3. Fetch consolidated data from Service
      const result = await StoreService.getStoreDetails(storeId);

      // 4. Verify store existence and status
      if (!result) {
        return Response.json({ 
          success: false, 
          message: 'Store not found or is currently inactive' 
        }, { status: 404 });
      }

      // 5. Return JSON payload
      return Response.json({
        success: true,
        store: result.store,
        deals: result.deals
      }, { status: 200 });

    } catch (error) {
      console.error('[StoreController.getStoreDetails Error]', error);

      // Handle common Mongoose validation/formatting errors
      if (error.name === 'CastError') {
        return Response.json({ 
          success: false, 
          message: 'Invalid Store ID provided' 
        }, { status: 400 });
      }

      // Standard error response
      return Response.json({
        success: false,
        message: 'Failed to retrieve store details'
      }, { status: 500 });
    }
  }

  /**
   * GET /api/stores/search
   * Discovery Engine: Search stores by keyword, category, and geolocation
   */
  static async searchStores(req) {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);
      
      const search = searchParams.get('search') || null;
      const categoryId = searchParams.get('categoryId') || null;
      const latitude = searchParams.get('latitude');
      const longitude = searchParams.get('longitude');
      const radius = parseFloat(searchParams.get('radius')) || 10;
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 10;

      // 1. Validation: Geo-params (if provided, both lat and lng are required)
      let lat = null;
      let lng = null;

      if (latitude || longitude) {
        lat = parseFloat(latitude);
        lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng)) {
          return Response.json({ 
            success: false, 
            message: 'Geospatial search requires valid numeric latitude and longitude' 
          }, { status: 400 });
        }

        // Validate Latitude (-90 to 90)
        if (lat < -90 || lat > 90) {
          return Response.json({ 
            success: false, 
            message: 'Latitude must be between -90 and 90' 
          }, { status: 400 });
        }

        // Validate Longitude (-180 to 180)
        if (lng < -180 || lng > 180) {
          return Response.json({ 
            success: false, 
            message: 'Longitude must be between -180 and 180' 
          }, { status: 400 });
        }
      }

      // 2. Execute Search via Service
      const result = await StoreService.searchStores({
        search,
        categoryId,
        latitude: lat,
        longitude: lng,
        radius,
        page,
        limit
      });

      // 3. Return Combined Payload
      return Response.json({
        success: true,
        total: result.total,
        page: result.page,
        limit: result.limit,
        stores: result.stores
      }, { status: 200 });

    } catch (error) {
      console.error('[StoreController.searchStores Error]', error);
      return Response.json({
        success: false,
        message: 'An error occurred while searching for stores'
      }, { status: 500 });
    }
  }
}
