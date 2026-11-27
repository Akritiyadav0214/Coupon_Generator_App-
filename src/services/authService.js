import api, { setStoredToken } from './api';

export const authService = {
  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    if (data.token) setStoredToken(data.token);
    return data;
  },

  async login(payload) {
    const { data } = await api.post('/auth/login', payload);
    if (data.token) setStoredToken(data.token);
    return data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setStoredToken(null);
    }
  },

  async getMe() {
    const { data } = await api.get('/auth/me');
    return data;
  },
};
