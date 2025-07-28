// services/BusTripService.ts (or similar)
import api from './axiosInstance';
import { ENDPOINTS } from '../constants/api';
import { ApiResponse, PaginatedResponse } from '../types/api';
import { BusTrip, BusTripFilters } from '../types/bustrip'; // Import updated types


const BusTripService = {

  // Get all Bus Trips (for Admin view - includes all statuses)
  getAllBusTrips: async (filters: BusTripFilters = {}): Promise<ApiResponse<PaginatedResponse<BusTrip>>> => {
    try {
      // Convert date to ISO string if it's a Date object for backend compatibility
      if (filters.date instanceof Date) {
        filters.date = filters.date.toISOString().split('T')[0];
      }
      const response = await api.get<ApiResponse<PaginatedResponse<BusTrip>>>(ENDPOINTS.BUS_TRIPS_ADMIN, { // New endpoint
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a specific Bus Trip (scheduled instance)
  createBusTrip: async (
    busTripData: Omit<BusTrip, 'id' | 'createdAt' | 'updatedAt' | 'bus' | 'driver' | 'trip' | 'available_seats' | 'status'> & { available_seats?: number },
  ): Promise<ApiResponse<BusTrip>> => {
    try {
      // Ensure departure_time is a valid ISO string if it's a Date object
      if (busTripData.departure_time instanceof Date) {
        busTripData.departure_time = busTripData.departure_time.toISOString();
      }
      const response = await api.post<ApiResponse<BusTrip>>(ENDPOINTS.BUS_TRIPS_CREATE, busTripData); // New endpoint for creation
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update a Bus Trip
  updateBusTrip: async (busTripId: string, updateData: Partial<BusTrip>): Promise<ApiResponse<BusTrip>> => {
    try {
      // Ensure departure_time is a valid ISO string if it's a Date object
      if (updateData.departure_time instanceof Date) {
        updateData.departure_time = updateData.departure_time.toISOString();
      }
      const response = await api.put<ApiResponse<BusTrip>>(ENDPOINTS.BUS_TRIP_UPDATE(busTripId), updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a Bus Trip
  deleteBusTrip: async (busTripId: string): Promise<ApiResponse<null>> => {
    try {
      const response = await api.delete<ApiResponse<null>>(ENDPOINTS.BUS_TRIP_DELETE(busTripId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },


  // --- User-focused operations for Scheduled Bus Trips ---

  // Get all *scheduled and available* Bus Trips (for user search)
  getScheduledBusTrips: async (filters: BusTripFilters = {}): Promise<ApiResponse<PaginatedResponse<BusTrip>>> => {
    try {
      // Convert date to ISO string if it's a Date object
      if (filters.date instanceof Date) {
        filters.date = filters.date.toISOString().split('T')[0]; // Send as YYYY-MM-DD
      }
      const response = await api.get<ApiResponse<PaginatedResponse<BusTrip>>>(ENDPOINTS.USER_SCHEDULED_BUS_TRIPS, { // New endpoint
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a specific Scheduled Bus Trip by ID (for user to view details before booking)
  getBusTripDetails: async (busTripId: string): Promise<ApiResponse<BusTrip>> => {
    try {
      const response = await api.get<ApiResponse<BusTrip>>(ENDPOINTS.USER_SCHEDULED_BUS_TRIPS_ID(busTripId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default BusTripService;