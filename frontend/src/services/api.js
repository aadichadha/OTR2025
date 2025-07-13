import axios from 'axios';
import { getToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('[API DEBUG] API_URL:', API_URL);
console.log('[API DEBUG] Environment:', import.meta.env.MODE);
console.log('[API DEBUG] VITE_API_URL:', import.meta.env.VITE_API_URL);

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
  const token = getToken();
  if (token && token !== 'dev-token') {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  console.log('[API DEBUG] Request:', config.method?.toUpperCase(), config.url, 'Headers:', config.headers);
  console.log('[API DEBUG] Request data:', config.data);
  return config;
}, error => {
  console.error('[API ERROR] Request error:', error);
  return Promise.reject(error);
});

api.interceptors.response.use(response => {
  console.log('[API DEBUG] Response status:', response.status);
  console.log('[API DEBUG] Response data type:', typeof response.data);
  console.log('[API DEBUG] Response data keys:', Object.keys(response.data || {}));
  console.log('[API DEBUG] Full response data:', response.data);
  return response;
}, error => {
  console.error('[API ERROR] Response error:', error);
  console.error('[API ERROR] Error response:', error.response?.data);
  
  // Handle authentication errors gracefully
  if (error.response?.status === 401 || error.response?.status === 403) {
    console.log('[API ERROR] Authentication error, clearing token');
    localStorage.removeItem('token');
    // Optionally redirect to login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  
  return Promise.reject(error);
});

export default api; 