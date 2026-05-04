import api from '../api';

/**
 * Admin Authentication Service
 * Manages admin login lifecycle and token persistence.
 */
export const adminAuthService = {
  /**
   * Authenticate admin using credentials
   * @param {Object} credentials - { email, password } or { phone, otp }
   */
  loginAdmin: async (credentials) => {
    try {
      // NOTE: Using the generic auth endpoint, filtering by role 'admin'
      const response = await api.post('/api/auth/verify-otp', credentials);
      
      if (response.data.success && response.data.user.role === 'admin') {
        const { token, user } = response.data;
        
        // Persist to localStorage for axios interceptor
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify(user));
        
        return { success: true, user };
      }
      
      throw new Error('Access denied. Not an admin account.');
    } catch (error) {
      console.error('[AdminAuthService Login Error]', error);
      throw error.response?.data?.message || error.message || 'Login failed';
    }
  },

  /**
   * Get the current authenticated user from storage
   */
  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Clear local session and logout
   */
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
  }
};
