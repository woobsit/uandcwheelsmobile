import api from './axiosInstance';
import { ENDPOINTS } from '../constants/api';
import { Bus, CreateBusData } from '../types/bus';
import { ApiResponse, PaginatedResponse } from '../types/api';

const BusService = {
  getAllBuses: async (status?: string): Promise<ApiResponse<Bus[]>> => {
    try {
      const response = await api.get<ApiResponse<Bus[]>>(ENDPOINTS.BUSES, {
        params: { status }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getBusById: async (id: string): Promise<ApiResponse<Bus>> => {
    try {
      const response = await api.get<ApiResponse<Bus>>(
        `${ENDPOINTS.BUSES}/${id}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  createBus: async (busData: CreateBusData): Promise<ApiResponse<Bus>> => {
    try {
      const response = await api.post<ApiResponse<Bus>>(
        ENDPOINTS.BUSES,
        busData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updateBus: async (
    id: string, 
    updateData: Partial<CreateBusData>
  ): Promise<ApiResponse<Bus>> => {
    try {
      const response = await api.patch<ApiResponse<Bus>>(
        `${ENDPOINTS.BUSES}/${id}`,
        updateData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  deleteBus: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete<ApiResponse<void>>(
        `${ENDPOINTS.BUSES}/${id}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getBusTrips: async (busId: string): Promise<ApiResponse<Trip[]>> => {
    try {
      const response = await api.get<ApiResponse<Trip[]>>(
        `${ENDPOINTS.BUSES}/${busId}/trips`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default BusService;