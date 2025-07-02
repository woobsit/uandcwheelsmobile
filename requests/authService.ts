import api from './axiosInstance';
import { ENDPOINTS } from '../constants/api';
import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse 
} from '../types/auth';
import { ApiResponse } from '../types/api';

const AuthService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>(
        ENDPOINTS.LOGIN, 
        credentials
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  register: async (userData: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>(
        ENDPOINTS.REGISTER, 
        userData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  logout: async (): Promise<ApiResponse<void>> => {
    try {
      const response = await api.post<ApiResponse<void>>(ENDPOINTS.LOGOUT);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  refreshToken: async (data: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> => {
    try {
      const response = await api.post<ApiResponse<RefreshTokenResponse>>(
        ENDPOINTS.REFRESH_TOKEN, 
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  verifyEmail: async (token: string): Promise<ApiResponse<void>> => {
    try {
      const response = await api.get<ApiResponse<void>>(
        ENDPOINTS.VERIFY_EMAIL(token)
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default AuthService;