import api from './axiosInstance';
import { ENDPOINTS } from '../constants/api';
import { Location, CreateLocationData } from '../types/location';
import { ApiResponse, PaginatedResponse } from '../types/api';

const LocationService = {
  getAllLocations: async (): Promise<ApiResponse<Location[]>> => {
    try {
      const response = await api.get<ApiResponse<Location[]>>(ENDPOINTS.LOCATIONS);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getLocationById: async (id: string): Promise<ApiResponse<Location>> => {
    try {
      const response = await api.get<ApiResponse<Location>>(
        `${ENDPOINTS.LOCATIONS}/${id}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  createLocation: async (locationData: CreateLocationData): Promise<ApiResponse<Location>> => {
    try {
      const response = await api.post<ApiResponse<Location>>(
        ENDPOINTS.LOCATIONS,
        locationData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updateLocation: async (
    id: string, 
    updateData: Partial<CreateLocationData>
  ): Promise<ApiResponse<Location>> => {
    try {
      const response = await api.patch<ApiResponse<Location>>(
        `${ENDPOINTS.LOCATIONS}/${id}`,
        updateData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  deleteLocation: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete<ApiResponse<void>>(
        `${ENDPOINTS.LOCATIONS}/${id}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default LocationService;