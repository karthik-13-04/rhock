import api from '../api';

export const couponService = {
  list: async (params = {}) => {
    const response = await api.get('/api/admin/coupons', { params });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/api/admin/coupons', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/admin/coupons/${id}`, data);
    return response.data;
  },
  remove: async (id) => {
    const response = await api.delete(`/api/admin/coupons/${id}`);
    return response.data;
  },
};
