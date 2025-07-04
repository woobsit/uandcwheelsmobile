import api from './axiosInstance';
import { ENDPOINTS } from '../constants/api';
import { User, UpdateProfileData, ChangePasswordData } from '../types/auth';
import { Booking } from '../types/booking';
import { ApiResponse } from '../types/api';

const UserService = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get<ApiResponse<User>>(ENDPOINTS.USER_PROFILE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (updateData: UpdateProfileData): Promise<ApiResponse<User>> => {
    try {
      const response = await api.patch<ApiResponse<User>>(ENDPOINTS.USER_PROFILE, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  changePassword: async (passwordData: ChangePasswordData): Promise<ApiResponse<void>> => {
    try {
      const response = await api.post<ApiResponse<void>>(
        `${ENDPOINTS.USER_PROFILE}/change-password`,
        passwordData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteAccount: async (): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete<ApiResponse<void>>(ENDPOINTS.USER_PROFILE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getBookings: async (): Promise<ApiResponse<Booking[]>> => {
    try {
      const response = await api.get<ApiResponse<Booking[]>>(`${ENDPOINTS.USER_PROFILE}/bookings`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default UserService;
