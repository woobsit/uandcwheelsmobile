import api from './axiosInstance';
import { ENDPOINTS } from '../constants/api';
import { ApiResponse, PaginatedResponse } from '../types/api';
import type { TripFilters, Trip } from '../types/trip';

const TripService = {
  getAllTrips: async (filters: TripFilters = {}): Promise<ApiResponse<PaginatedResponse<Trip>>> => {
    try {
      const response = await api.get<ApiResponse<PaginatedResponse<Trip>>>(ENDPOINTS.TRIPS, {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getTripById: async (tripId: string): Promise<ApiResponse<Trip>> => {
    try {
      const response = await api.get<ApiResponse<Trip>>(ENDPOINTS.TRIP_DETAILS(tripId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  searchTrips: async (from: string, to: string, date: string): Promise<ApiResponse<Trip[]>> => {
    try {
      const response = await api.get<ApiResponse<Trip[]>>(ENDPOINTS.TRIPS, {
        params: { from, to, date },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createTrip: async (
    tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ApiResponse<Trip>> => {
    try {
      const response = await api.post<ApiResponse<Trip>>(ENDPOINTS.TRIPS, tripData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateTrip: async (tripId: string, updateData: Partial<Trip>): Promise<ApiResponse<Trip>> => {
    try {
      const response = await api.put<ApiResponse<Trip>>(ENDPOINTS.TRIP_DETAILS(tripId), updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default TripService;
