import api from './axiosInstance';

export const AuthService = {
  register: (data: { name: string; email: string; password: string; confirmPassword: String }) => {
    
    return api.post('/auth/register', data);
  },

  login: (credentials: { email: string; password: string }) => {
    return api.post('/auth/login', credentials);
  },

  logout: () => {
    return api.post('/auth/logout');
  },

  refreshToken: (refreshToken: string) => {
    return api.post('/auth/refresh-token', { refreshToken });
  },

  verifyEmail: (token: string) => {
    return api.get(`/auth/verify-email?token=${token}`);
  },

  forgotPassword: (email: string) => {
    return api.post('/auth/forgot-password', { email });
  },

  resetPassword: (data: { token: string; password: string }) => {
    return api.post('/auth/reset-password', data);
  },
   resendVerification: (email: string) => {
    return api.post('/auth/resend-verification', { email });
  },
};

export default AuthService;
