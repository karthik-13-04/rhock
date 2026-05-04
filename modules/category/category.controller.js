import { CategoryService } from './category.service.js';
import { dbConnect } from '../../config/database.js';

/**
 * Category Controller
 * Interfaces between the API route and the Category service
 */
export class CategoryController {
  /**
   * Fetch all active categories
   * Endpoint: GET /api/categories
   */
  static async getCategories(req) {
    try {
      // 1. Ensure database connection
      await dbConnect();

      // 2. Fetch categories from service
      const categories = await CategoryService.getActiveCategories();

      // 3. Return successful response
      return Response.json({
        success: true,
        categories
      }, { status: 200 });

    } catch (error) {
      console.error('[CategoryController.getCategories Error]', error);

      // Handle failures gracefully
      return Response.json({
        success: false,
        message: 'Failed to fetch categories'
      }, { status: 500 });
    }
  }
}
