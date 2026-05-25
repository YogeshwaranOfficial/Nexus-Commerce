import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '../stores';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach access token ─────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor: refresh on 401 ────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        useAuthStore.getState().setAuth(useAuthStore.getState().user!, newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login?session=expired';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ─── Typed API helpers ────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) => api.post('/auth/register', data),
  verifyEmail: (data: { email: string; otp: string }) => api.post('/auth/verify-email', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

export const productApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/products', { params }),
  getBySlug: (slug: string) => api.get(`/products/${slug}`),
  getRelated: (id: string) => api.get(`/products/${id}/related`),
  getFlashSales: () => api.get('/products/flash-sales'),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: string, data: unknown) => api.patch(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const orderApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  checkout: (data: unknown) => api.post('/orders/checkout', data),
  cancel: (id: string, reason?: string) => api.post(`/orders/${id}/cancel`, { reason }),
  updateStatus: (id: string, status: string, message?: string) =>
    api.patch(`/orders/${id}/status`, { status, message }),
};

export const cartApi = {
  get: () => api.get('/cart'),
  add: (data: unknown) => api.post('/cart', data),
  update: (itemId: string, quantity: number) => api.patch(`/cart/${itemId}`, { quantity }),
  remove: (itemId: string) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete('/cart'),
  applyCoupon: (code: string) => api.post('/cart/coupon', { code }),
};

export const reviewApi = {
  getByProduct: (productId: string, params?: Record<string, unknown>) =>
    api.get(`/reviews/product/${productId}`, { params }),
  create: (data: unknown) => api.post('/reviews', data),
  update: (id: string, data: unknown) => api.patch(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
  markHelpful: (id: string) => api.post(`/reviews/${id}/helpful`),
};

export const wishlistApi = {
  get: () => api.get('/wishlist'),
  add: (productId: string) => api.post('/wishlist', { productId }),
  remove: (productId: string) => api.delete(`/wishlist/${productId}`),
};

export const paymentApi = {
  createStripeIntent: (orderId: string) => api.post('/payments/stripe/intent', { orderId }),
  createRazorpayOrder: (orderId: string) => api.post('/payments/razorpay/order', { orderId }),
  verifyRazorpay: (data: unknown) => api.post('/payments/razorpay/verify', data),
};

export const searchApi = {
  search: (query: string, params?: Record<string, unknown>) =>
    api.get('/search', { params: { q: query, ...params } }),
  suggestions: (query: string) => api.get('/search/suggestions', { params: { q: query } }),
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  updateUser: (id: string, data: unknown) => api.patch(`/admin/users/${id}`, data),
  getOrders: (params?: Record<string, unknown>) => api.get('/admin/orders', { params }),
  getProducts: (params?: Record<string, unknown>) => api.get('/admin/products', { params }),
  togglePublish: (id: string) => api.patch(`/admin/products/${id}/publish`, {}),
  getSalesAnalytics: (period: string) => api.get(`/admin/analytics/sales?period=${period}`),
  getRevenue: (period: string) => api.get(`/admin/analytics/revenue?period=${period}`),
  getPendingReviews: (params?: Record<string, unknown>) => api.get('/admin/reviews/pending', { params }),
  approveReview: (id: string) => api.patch(`/admin/reviews/${id}/approve`, {}),
  getCoupons: () => api.get('/coupons'),
  createCoupon: (data: unknown) => api.post('/coupons', data),
  updateCoupon: (id: string, data: unknown) => api.patch(`/coupons/${id}`, data),
  deleteCoupon: (id: string) => api.delete(`/coupons/${id}`),
  getCategories: () => api.get('/categories'),
  createCategory: (data: unknown) => api.post('/categories', data),
  updateCategory: (id: string, data: unknown) => api.patch(`/categories/${id}`, data),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: unknown) => api.patch('/users/profile', data),
  updateAvatar: (avatarUrl: string) => api.patch('/users/avatar', { avatarUrl }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch('/users/password', data),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (data: unknown) => api.post('/users/addresses', data),
  updateAddress: (id: string, data: unknown) => api.patch(`/users/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),
  setDefaultAddress: (id: string) => api.patch(`/users/addresses/${id}/default`, {}),
};

export const notificationApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`, {}),
  markAllRead: () => api.patch('/notifications/read-all', {}),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const sellerApi = {
  getDashboard: () => api.get('/seller/dashboard'),
  getProducts: (params?: Record<string, unknown>) => api.get('/seller/products', { params }),
  getOrders: (params?: Record<string, unknown>) => api.get('/seller/orders', { params }),
  getAnalytics: (period: string) => api.get(`/seller/analytics?period=${period}`),
  updateInventory: (id: string, data: unknown) => api.patch(`/seller/products/${id}/inventory`, data),
};
