// services/BusTripService.ts (or similar)
import api from './axiosInstance';
import { ENDPOINTS } from '../constants/api';
import { ApiResponse } from '../types/api';
import { TripBase } from '../types/trip'; // Import updated types


const TripService = {
  // --- Admin-focused operations for Trip Routes (if needed) ---
  // Create a new Trip Route (the template)
  createTripRoute: async (
    tripRouteData: Omit<TripBase, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'departureLocation' | 'arrivalLocation'>,
  ): Promise<ApiResponse<TripBase>> => {
    try {
      const response = await api.post<ApiResponse<TripBase>>(ENDPOINTS.TRIPS_ROUTES_CREATE, tripRouteData); // You'll need a new endpoint for this
      return response.data;
    } catch (error) {
      throw error;
    }
  },


};

export default TripService;