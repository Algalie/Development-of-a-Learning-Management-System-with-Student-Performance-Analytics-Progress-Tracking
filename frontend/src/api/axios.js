import axios from 'axios';
import { getToken, clearAuth } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// DON'T auto-redirect on 401 - let the pages handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only clear auth if token is explicitly expired
    if (error.response?.status === 401) {
      const code = error.response?.data?.code;
      if (code === 'TOKEN_EXPIRED') {
        clearAuth();
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;