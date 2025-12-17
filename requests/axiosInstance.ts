import axios from 'axios';
import { attachAuthToken, refreshAuthToken, clearTokens } from '../utils/apiHelpers';

const api = axios.create({
  baseURL: 'http://192.168.0.131:5000/api/v1',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(attachAuthToken);

// Response interceptor
  api.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await refreshAuthToken();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          await clearTokens();
          // Redirect to login screen
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    },
  );

export default api;
