// src/utils/authUtils.ts
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse } from '../types/api';
import axios from 'axios';

// Secure storage keys
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

// Format error message for display
export const formatErrorMessage = (error: any): string => {
  if (error?.response?.data) {
    const response = error.response.data as ApiResponse<any>;

    if (response.message) return response.message;
    if (response.error?.details) return Object.values(response.error.details).join('\n');
  } else if (error.request) {
    return 'Network error - Please check your connection';
  }
  return error.message || 'An unexpected error occurred';
};

// Show alert for API errors
export const showApiErrorAlert = (error: any, customMessage: string | null = null) => {
  Alert.alert('Error', customMessage || formatErrorMessage(error));
};

// // Get cookies from API domain
// const getApiCookies = async () => {
//   return CookieManager.get('https://your-api-domain.com');
// };

// Get auth token from secure storage
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get auth token', error);
    return null;
  }
};

// Get refresh token from secure storage
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get refresh token', error);
    return null;
  }
};

// Save tokens to secure storage
export const saveTokens = async (accessToken: string, refreshToken: string, rememberMe?: boolean): Promise<void> => {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);

      if (rememberMe) {
    // Save email for auto-fill (but never save password!)
    await SecureStore.setItemAsync('remembered_email', email);
  } else {
    await SecureStore.deleteItemAsync('remembered_email');
  }
  } catch (error) {
    showApiErrorAlert(error, 'Failed to login');
  }
};

// Clear tokens from secure storage
export const clearTokens = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear tokens', error);
  }
};

// Add to axios request config
export const attachAuthToken = async (config: any) => {
  const token = await getAuthToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Refresh auth token
export const refreshAuthToken = async () => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await axios.post('/auth/refresh-token', {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    await saveTokens(accessToken, newRefreshToken || refreshToken);
    return accessToken;
  } catch (error) {
    await clearTokens();
    throw error;
  }
};
