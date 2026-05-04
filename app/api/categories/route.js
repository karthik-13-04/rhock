import { CategoryController } from '../../../modules/category/category.controller.js';

/**
 * Public API for fetching all active categories
 * Endpoint: GET /api/categories
 */
export async function GET(req) {
  return await CategoryController.getCategories(req);
}
