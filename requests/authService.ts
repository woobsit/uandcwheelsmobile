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

   verifyEmail: (code: string, email: string) => {
    return api.post('/auth/verify-email', { code, email });
  },
  forgotPassword: (email: string) => {
    return api.post('/auth/forgot-password', { email });
  },

  verifyResetCode: (email: string, code: number) => {
    return api.post('/auth/verify-reset-code', { email, code });
  },

  resetPassword: (email: string, code: string, password: string ) => {
    return api.post('/auth/reset-password', { email, code, password });
  },
   resendVerification: (email: string) => {
    return api.post('/auth/resend-verification', { email });
  },
};

export default AuthService;
