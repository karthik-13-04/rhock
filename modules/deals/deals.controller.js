import { DealsService } from '@/modules/deals/deals.service.js';
import { dbConnect } from '@/config/database.js';

/**
 * Deals Controller
 * Handles incoming requests for deal discovery
 */
export class DealsController {
  /**
   * GET /api/deals
   * Fetches all approved deals with optional filtering & pagination
   */
  static async getDeals(req) {
    try {
      // 1. Ensure Database Connection
      // This is crucial for Next.js serverless environments
      await dbConnect();

      // 2. Extract and sanitize query parameters
      const { searchParams } = new URL(req.url);
      
      const search = searchParams.get('search') || null;
      const categoryId = searchParams.get('categoryId') || null;
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 10;

      // 3. Call Service for business logic
      const result = await DealsService.getDeals({
        search,
        categoryId,
        page,
        limit
      });

      // 4. Return successful response
      // Structure matches the requirements specified in the prompt
      return Response.json({
        success: true,
        total: result.total,
        page: result.page,
        limit: result.limit,
        deals: result.deals
      }, { status: 200 });

    } catch (error) {
      console.error('[DealsController.getDeals Error]', error);
      
      // Handle potential edge cases like DB failure
      return Response.json({
        success: false,
        message: 'Failed to fetch deals. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 });
    }
  }
}
