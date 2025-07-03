import api from './axiosInstance';
import { ENDPOINTS } from '../constants/api';
import { Driver, CreateDriverData } from '../types/driver';
import { ApiResponse, PaginatedResponse } from '../types/api';

const DriverService = {
  getAllDrivers: async (status?: string): Promise<ApiResponse<Driver[]>> => {
    try {
      const response = await api.get<ApiResponse<Driver[]>>(ENDPOINTS.DRIVERS, {
        params: { status }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getDriverById: async (id: string): Promise<ApiResponse<Driver>> => {
    try {
      const response = await api.get<ApiResponse<Driver>>(
        `${ENDPOINTS.DRIVERS}/${id}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  createDriver: async (driverData: CreateDriverData): Promise<ApiResponse<Driver>> => {
    try {
      const response = await api.post<ApiResponse<Driver>>(
        ENDPOINTS.DRIVERS,
        driverData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updateDriver: async (
    id: string, 
    updateData: Partial<CreateDriverData>
  ): Promise<ApiResponse<Driver>> => {
    try {
      const response = await api.patch<ApiResponse<Driver>>(
        `${ENDPOINTS.DRIVERS}/${id}`,
        updateData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  deleteDriver: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete<ApiResponse<void>>(
        `${ENDPOINTS.DRIVERS}/${id}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getDriverTrips: async (driverId: string): Promise<ApiResponse<Trip[]>> => {
    try {
      const response = await api.get<ApiResponse<Trip[]>>(
        `${ENDPOINTS.DRIVERS}/${driverId}/trips`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default DriverService;