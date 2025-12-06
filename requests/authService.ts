import api from './axiosInstance';

export const AuthService = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    return await api.post('/auth/register', data);
  },

  login: async (data: { email: string; password: string; }) => {
    
    return await api.post('/auth/login', data);
  },

  logout: async () => {
    return await api.post('/auth/logout');
  },

  refreshToken: async () => {
    return await api.post('/auth/refresh-token');
  },

  verifyEmail: async (code: string, email: string) => {
    return await api.post('/auth/verify-email', { code, email });
  },
  forgotPassword: async (email: string) => {
    return await api.post('/auth/forgot-password', { email });
  },

  verifyResetCode: async (email: string, code: number) => {
    return await api.post('/auth/verify-reset-code', { email, code });
  },

  resetPassword: async (email: string, code: string, password: string) => {
    return await api.post('/auth/reset-password', { email, code, password });
  },
  resendVerification: async (email: string) => {
    return await api.post('/auth/resend-verification', { email });
  },
};

export default AuthService;
