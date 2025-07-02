import { Alert } from 'react-native';
import { ApiResponse } from '../types/api';

// Format error message for display
export const formatErrorMessage = (error: any): string => {
  if (error?.response?.data) {
    // Server responded with error status
    const response = error.response.data as ApiResponse<any>;
    
    if (response.message) {
      return response.message;
    }
    
    if (response.error?.details) {
      return Object.values(response.error.details).join('\n');
    }
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error - Please check your connection';
  } else {
    // Something else happened
    return error.message || 'Unknown error occurred';
  }
  
  return 'An unexpected error occurred';
};

// Show alert for API errors
export const showApiErrorAlert = (error: any, customMessage: string | null = null) => {
  const message = customMessage || formatErrorMessage(error);
  Alert.alert('Error', message);
};

// Get auth token from storage
export const getAuthToken = async (): Promise<string | null> => {
  // Replace with your actual token retrieval logic
  return localStorage.getItem('authToken');
};

// Get refresh token from storage
export const getRefreshToken = async (): Promise<string | null> => {
  // Replace with your actual token retrieval logic
  return localStorage.getItem('refreshToken');
};

// Save tokens to storage
export const saveTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  // Replace with your actual token saving logic
  localStorage.setItem('authToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

// Clear tokens from storage
export const clearTokens = async (): Promise<void> => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
};