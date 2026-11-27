import api from './api';
import { getTodayISO } from '../utils/formatters';

export const couponService = {
  async getDashboard() {
    const { data } = await api.get('/student/dashboard', {
      params: { date: getTodayISO() },
    });
    return data.data;
  },

  async getTodayCoupon() {
    const { data } = await api.get('/student/coupons/today');
    return data.data;
  },

  async generateTodayCoupon() {
    const { data } = await api.post('/student/coupons/generate');
    return data.data;
  },

  async getHistory(params = {}) {
    const { data } = await api.get('/student/coupons', { params });
    return data.data;
  },

  async getProfile() {
    const { data } = await api.get('/student/profile');
    return data.user;
  },

  async updateProfile(payload) {
    const { data } = await api.put('/student/profile', payload);
    return data;
  },

  async changePassword(payload) {
    const { data } = await api.put('/student/password', payload);
    return data;
  },

  async getByCouponId(couponId) {
    const { data } = await api.get(`/coupons/${encodeURIComponent(couponId)}`);
    return data.data;
  },

  async verifyCoupon(payload) {
    const { data } = await api.post('/coupons/verify', payload);
    return data.data;
  },

  async redeemCoupon(payload) {
    const { data } = await api.post('/coupons/redeem', payload);
    return data;
  },
};
