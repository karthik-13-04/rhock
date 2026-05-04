import api from '../api';

/**
 * Admin Coins Service
 */
export const coinsService = {
  /**
   * Get all coin transactions
   */
  getCoinTransactions: async (page = 1, limit = 20) => {
    try {
      const response = await api.get('/api/admin/coins', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch coin transactions';
    }
  }
};
