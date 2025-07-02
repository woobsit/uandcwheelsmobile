export const API_BASE_URL = 'https://api.yourdomain.com/v1';
export const TIMEOUT = 30000; // 30 seconds

export const ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  TRIPS: '/trips',
  TRIP_DETAILS: (id: string) => `/trips/${id}`,
  BOOKINGS: '/bookings',
  BOOKING_DETAILS: (id: string) => `/bookings/${id}`,
  LOCATIONS: '/locations',
  USER_PROFILE: '/users/profile',
  VERIFY_EMAIL: (token: string) => `/auth/verify-email/${token}`,
};

