import api from './api';

export const adminService = {
  async getDashboard() {
    const { data } = await api.get('/admin/dashboard');
    return data.data;
  },

  async getStudents(params = {}) {
    const { data } = await api.get('/admin/students', { params });
    return data.data;
  },

  async getStudentDetail(id) {
    const { data } = await api.get(`/admin/students/${id}`);
    return data.data;
  },

  async updateStudentStatus(id, isActive) {
    const { data } = await api.patch(`/admin/students/${id}/status`, { isActive });
    return data;
  },

  async getCoupons(params = {}) {
    const { data } = await api.get('/admin/coupons', { params });
    return data.data;
  },

  async getAnalytics(days = 14) {
    const { data } = await api.get('/admin/analytics', { params: { days } });
    return data.data;
  },
};

export const notificationService = {
  async getNotifications(limit = 20) {
    const { data } = await api.get('/notifications', { params: { limit } });
    return data.data;
  },

  async markAsRead(id) {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data.data;
  },

  async markAllAsRead() {
    const { data } = await api.patch('/notifications/read-all');
    return data;
  },
};
