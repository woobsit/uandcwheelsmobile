export const API_BASE_URL = '192.168.0.120:5000/api/v1';
export const TIMEOUT = 30000; // 30 seconds

export const ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  VERIFY_EMAIL: (token: string) => `/auth/verify-email/${token}`,
  FORGOT_PASSWORD: '/auth/forgot-password',
  PASSWORD_RESET: (token: string) => `/auth/reset-password/${token}`,
  TRIPS: '/trips',
  TRIP_DETAILS: (id: string) => `/trips/${id}`,
  BOOKINGS: '/bookings',
  BOOKING_DETAILS: (id: string) => `/bookings/${id}`,
  LOCATIONS: '/locations',
  USER_PROFILE: '/users/profile',
  BUSES: '/bus',
  DRIVERS: '/driver',
};
