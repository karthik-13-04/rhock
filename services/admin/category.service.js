import api from '../api';

/**
 * Admin Categories Service
 */
export const categoryService = {
  /**
   * Get all categories
   */
  getCategories: async () => {
    try {
      const response = await api.get('/api/categories');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch categories';
    }
  },

  /**
   * Create a new category
   */
  createCategory: async (categoryData) => {
    try {
      const response = await api.post('/api/admin/categories', categoryData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to create category';
    }
  }
};
