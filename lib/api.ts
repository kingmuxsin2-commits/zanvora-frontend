import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://marketplace-api.test/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Essential for Sanctum cookie auth
});

// Interceptor: Fetch CSRF token before state-changing requests
api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    try {
      // Sanctum's CSRF cookie endpoint
      await axios.get('http://marketplace-api.test/sanctum/csrf-cookie', {
        withCredentials: true,
      });
    } catch (error) {
      console.error('Failed to fetch CSRF token', error);
    }
  }
  return config;
});

export default api;