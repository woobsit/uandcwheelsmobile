import {Alert} from 'react-native';

// utils/errorUtils.ts
export const showApiErrorAlert = (error: any, defaultMessage = 'An error occurred') => {
  let message = defaultMessage;
  
  if (error.response?.data?.message) {
    message = error.response.data.message;
  } else if (error.message) {
    message = error.message;
  }
  
  Alert.alert('Error', message);
};