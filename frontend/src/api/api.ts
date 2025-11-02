import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
export const api = axios.create({ baseURL: API_BASE });

// Attach auth token and handle 401
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('userChanged'));
    }
    return Promise.reject(error);
  }
);

export const getExperiences = (params?: any) => api.get('/experiences', { params });
export const getExperience = (id: string) => api.get(`/experiences/${id}`);
export const validatePromo = (code: string) => api.post('/promo/validate', { code });
export const createBooking = (payload: any) => api.post('/bookings', payload);
export const createCheckoutSession = (payload: any) => api.post('/payments/create-checkout-session', payload);
export const createPayPalOrder = (payload: any) => api.post('/payments/create-paypal-order', payload);
export const capturePayPalOrder = (payload: any) => api.post('/payments/capture-paypal-order', payload);
export const getBookings = (email?: string) => api.get('/bookings', { params: email ? { email } : {} });

// Saved searches
export const getSavedSearches = () => api.get('/saved-searches');
export const saveSearch = (name: string, filters: any) => api.post('/saved-searches', { name, filters });
export const deleteSavedSearch = (id: string) => api.delete(`/saved-searches/${id}`);
