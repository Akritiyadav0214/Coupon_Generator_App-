import api from './api';

export const menuService = {
  async getStudentMenu(date) {
    const { data } = await api.get('/student/menu', {
      params: date ? { date } : {},
    });
    return data.data;
  },

  async getAdminMenus(date) {
    const { data } = await api.get('/admin/menu', {
      params: date ? { date } : {},
    });
    return data.data;
  },

  async saveMenu(payload) {
    const { data } = await api.post('/admin/menu', payload);
    return data;
  },

  async updateMenu(id, payload) {
    const { data } = await api.put(`/admin/menu/${id}`, payload);
    return data;
  },

  async deleteMenu(id) {
    const { data } = await api.delete(`/admin/menu/${id}`);
    return data;
  },
};
