import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
export const api = axios.create({ baseURL: API_BASE });

// Attach auth token and handle 401
api.interceptors.request.use((config) => {
  const token = secureStorage.getItem('token');
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
      secureStorage.removeItem('token');
      secureStorage.removeItem('user');
      window.dispatchEvent(new Event('userChanged'));
    }
    return Promise.reject(error);
  }
);

// Enhanced error handler
const handleApiError = (error: any) => {
  console.error('API Error:', error);

  // Log to analytics if available
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: 'api_error',
      error_type: error?.response?.status || 'unknown',
      error_message: error?.message || 'Unknown error'
    });
  }

  throw error;
};

// Security utilities
export const secureStorage = {
  setItem: (key: string, value: string) => {
    try {
      // In production, consider using more secure storage
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to store item securely:', error);
    }
  },

  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to retrieve item securely:', error);
      return null;
    }
  },

  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove item securely:', error);
    }
  }
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .slice(0, 1000); // Limit length
};

// Rate limiting for API calls
class RateLimiter {
  private calls = new Map<string, number[]>();

  canMakeCall(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const calls = this.calls.get(key) || [];

    // Remove old calls outside the window
    const validCalls = calls.filter(call => now - call < windowMs);
    this.calls.set(key, validCalls);

    if (validCalls.length >= limit) {
      return false;
    }

    validCalls.push(now);
    this.calls.set(key, validCalls);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

export const getExperiences = (params?: any) => api.get('/experiences', { params }).catch(handleApiError);
export const getExperience = (id: string) => api.get(`/experiences/${id}`).catch(handleApiError);
export const validatePromo = (code: string) => api.post('/promo/validate', { code }).catch(handleApiError);
export const createBooking = (payload: any) => api.post('/bookings', payload).catch(handleApiError);
export const createCheckoutSession = (payload: any) => api.post('/payments/create-checkout-session', payload).catch(handleApiError);
export const createPayPalOrder = (payload: any) => api.post('/payments/create-paypal-order', payload).catch(handleApiError);
export const capturePayPalOrder = (payload: any) => api.post('/payments/capture-paypal-order', payload).catch(handleApiError);
export const getBookings = (email?: string) => api.get('/bookings', { params: email ? { email } : {} }).catch(handleApiError);

// Saved searches
export const getSavedSearches = () => api.get('/saved-searches');
export const saveSearch = (name: string, filters: any) => api.post('/saved-searches', { name, filters });
export const deleteSavedSearch = (id: string) => api.delete(`/saved-searches/${id}`);
export const getProfile = () => api.get('/auth/profile');
export const updateProfile = (data: any) => api.put('/auth/profile', data);
export const getChat = () => api.get('/chat');
export const sendChatMessage = (message: string) => api.post('/chat/message', { message });
