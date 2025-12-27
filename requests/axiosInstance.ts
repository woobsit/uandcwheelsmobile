import axios from 'axios';
import { attachAuthToken, refreshAuthToken, clearTokens, getAuthToken } from '../utils/apiHelpers';
import { API_BASE_URL } from "./../constants/api";

// 1. PUBLIC INSTANCE (For Guests/Booking)
// No interceptors. It won't try to refresh or error out on 401s globally.
export const publicApi = axios.create({
  baseURL: `${API_BASE_URL}/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. PRIVATE INSTANCE (For Logged-in Users/Dashboard)
const api = axios.create({
  baseURL: `${API_BASE_URL}/v1`,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor ONLY for the private instance
api.interceptors.request.use(attachAuthToken);

// Response interceptor ONLY for the private instance
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const currentToken = await getAuthToken();

    if (error.response?.status === 401 && currentToken && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAuthToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;