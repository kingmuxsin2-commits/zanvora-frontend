import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://marketplace-api.test/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: add Bearer token from localStorage or sessionStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      // First check direct storage keys used by the updated auth store
      const token = window.localStorage.getItem('auth_token') || window.sessionStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Fallback: check Zustand persist cache for the token
        const storage = localStorage.getItem('auth-storage');
        if (storage) {
          const parsed = JSON.parse(storage);
          const persistToken = parsed?.state?.token;
          if (persistToken) {
            config.headers.Authorization = `Bearer ${persistToken}`;
          }
        }
      }
    } catch (e) {
      console.error('Failed to attach auth token', e);
    }
  }
  return config;
});

export default api;