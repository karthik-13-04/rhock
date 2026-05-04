import { DealService } from './deal.service.js';
import { dbConnect } from '../../config/database.js';

/**
 * Deal Controller
 * Handles public access to deals
 */
export class DealController {
  /**
   * GET /api/deals
   * Public: Fetch all approved deals
   */
  static async getDeals(req) {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);
      const options = {
        category: searchParams.get('category'),
        lat: searchParams.get('lat'),
        lng: searchParams.get('lng'),
        limit: parseInt(searchParams.get('limit')) || 20
      };

      const deals = await DealService.getDeals(options);

      return Response.json({
        success: true,
        deals    
      }, { status: 200 });

    } catch (error) {
      console.error('[DealController.getDeals Error]', error);
      return Response.json({
        success: false,
        message: 'Failed to fetch deals'
      }, { status: 500 });     
    }
  }
}