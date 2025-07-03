import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, TIMEOUT } from '../constants/api';
import { getAuthToken, getRefreshToken, saveTokens, clearTokens } from '../utils/apiHelpers';
import { ApiResponse } from '../types/api';
import { RefreshTokenResponse, RefreshTokenRequest } from '../types/auth';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config: any) => {
    // Add auth token to request headers
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiResponse<any>>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // If token expired and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token available');
        
        const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken } as RefreshTokenRequest
        );
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Save new tokens
        await saveTokens(accessToken, newRefreshToken);
        
        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed - clear tokens and logout user
        console.error('Token refresh failed:', refreshError);
        await clearTokens();
        // Implement your logout logic here (e.g., redirect to login)
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;