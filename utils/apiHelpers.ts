// src/utils/authUtils.ts
import { Alert } from 'react-native';
import CookieManager from 'react-native-cookies';
import { ApiResponse } from '../types/api';

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

// Get cookies from API domain
const getApiCookies = async () => {
  return CookieManager.get('https://your-api-domain.com');
};

// Get auth token from cookies
export const getAuthToken = async (): Promise<string | null> => {
  const cookies = await getApiCookies();
  return cookies.authToken?.value || null;
};

// Get refresh token from cookies
export const getRefreshToken = async (): Promise<string | null> => {
  const cookies = await getApiCookies();
  return cookies.refreshToken?.value || null;
};

// Save tokens to cookies
export const saveTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  const domain = 'your-api-domain.com';
  
  await CookieManager.set('https://' + domain, {
    name: 'authToken',
    value: accessToken,
    domain: '.' + domain,
    path: '/',
    secure: true,
    expires: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  });

  await CookieManager.set('https://' + domain, {
    name: 'refreshToken',
    value: refreshToken,
    domain: '.' + domain,
    path: '/',
    secure: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
};

// Clear tokens from cookies
export const clearTokens = async (): Promise<void> => {
  const domain = 'your-api-domain.com';
  await CookieManager.clearByName('https://' + domain, 'authToken', '/');
  await CookieManager.clearByName('https://' + domain, 'refreshToken', '/');
};