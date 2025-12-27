// services/BusTripService.ts (No major changes needed from your provided code, just ensuring it matches and confirming the types)

import api from './axiosInstance';
import {publicApi} from './axiosInstance';
import { ENDPOINTS } from '../constants/api';
import { ApiResponse, PaginatedResponse } from '../types/api'; // Ensure you have ApiResponse and PaginatedResponse defined
import { BusTrip, BusTripFilters, GetAvailableDatesForRouteParams, PaginatedAvailableDatesResponse, PaginatedAvailableBusesResponse, GetAvailableBusesForDateParams } from '../types/bustrip';

// Define the new interface for the aggregated data
export interface UniqueTripRoute {
  departureLocationName: string;
  departureLocationState: string;
  arrivalLocationName: string;
  arrivalLocationState: string;
  minFare: number;
  maxFare: number;
  availableDatesCount: number;
}

const BusTripService = {
  
  getAllAvailableTrips: async (params?: { page: number; limit: number }): Promise<ApiResponse<PaginatedResponse<UniqueTripRoute>>> => {
    try {
      
      const response = await publicApi.get<ApiResponse<PaginatedResponse<UniqueTripRoute>>>(
        ENDPOINTS.ALL_AVAILABLE_TRIPS,
        { params }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

getAvailableDatesForRoute: async (
    params: GetAvailableDatesForRouteParams
  ): Promise<ApiResponse<PaginatedAvailableDatesResponse>> => {
    try {
      const response = await publicApi.get<ApiResponse<PaginatedAvailableDatesResponse>>(
        ENDPOINTS.AVAILABLE_DATES,
        { params }
      );

      return response.data;
    } catch (error) {
      // Re-throw the error
      throw error;
    }
  },

// --- NEW SERVICE FUNCTION ---
  /**
   * Fetches available buses for a specific route and a selected date.
   */
  getAvailableBusesForDate: async (
    params: GetAvailableBusesForDateParams
  ): Promise<ApiResponse<PaginatedAvailableBusesResponse>> => {
    try {
      const response = await publicApi.get<ApiResponse<PaginatedAvailableBusesResponse>>(
        ENDPOINTS.AVAILABLE_BUSES_FOR_DATE, // This endpoint needs to be defined
        { params }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

    /**
   * Fetches the full details of a specific bus trip by its ID.
   * @param busTripId The ID of the bus trip to fetch.
   */
  getBusTripDetails: async (busTripId: number): Promise<ApiResponse<BusTrip>> => {
    try {
      const response = await publicApi.get<ApiResponse<BusTrip>>(`${ENDPOINTS.BUS_TRIPS}/${busTripId}/details`);
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
      const response = await api.post<ApiResponse<BusTrip>>(ENDPOINTS.BUS_TRIPS_CREATE, busTripData);
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


   /**
   * Fetches scheduled bus trips for a specific date and route.
   * This is for the TripDetailsScreen.
   */
  getScheduledBusTripsByDate: async (filters: BusTripFilters = {}): Promise<ApiResponse<PaginatedResponse<BusTrip>>> => {
    try {
      // Your existing date conversion logic
      if (filters.date instanceof Date) {
        filters.date = filters.date.toISOString().split('T')[0];
      }
      
      const response = await publicApi.get<ApiResponse<PaginatedResponse<BusTrip>>>(ENDPOINTS.USER_SCHEDULED_BUS_TRIPS, {
        params: filters,
      });
     // console.log(JSON.stringify(response.data,  null, 2))
      return response.data;
    } catch (error) {
      throw error;
    }
  },

   /**
   * Fetches unique trip routes with aggregated data (min/max fare, available dates).
   * This is for the BookTransportScreen.
   */
  getUniqueTripRoutes: async (filters: { 
    departureLocationName?: string; 
    arrivalLocationName?: string; 
  } = {}): Promise<ApiResponse<PaginatedResponse<UniqueTripRoute>>> => {
    try {
      const response = await api.get<ApiResponse<PaginatedResponse<UniqueTripRoute>>>(ENDPOINTS.USER_SCHEDULED_BUS_TRIPS, {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // Get all *scheduled and available* Bus Trips (for user search)
  /*getScheduledBusTrips: async (filters: BusTripFilters = {}): Promise<ApiResponse<PaginatedResponse<BusTrip>>> => {
    try {
      // Your existing console.log("hello");
      // Convert date to YYYY-MM-DD string if it's a Date object.
      // This is crucial for filtering by date on the backend.
      if (filters.date instanceof Date) {
        // This line assumes your backend expects 'YYYY-MM-DD'
        filters.date = filters.date.toISOString().split('T')[0];
      } else if (typeof filters.date === 'string') {
        // Ensure string dates are already in 'YYYY-MM-DD' if used as filter
        // Or, convert if they're in a different format
        // For example, if your input string might be 'MMM d, yyyy', you'd convert it:
        // filters.date = formatDate(filters.date, 'yyyy-MM-dd'); // Requires date-fns in formatDate
      }
         const response = await api.get<ApiResponse<PaginatedResponse<BusTrip>>>(ENDPOINTS.USER_SCHEDULED_BUS_TRIPS, {
           params: filters,
         });
      return response.data;
    } catch (error) {
      throw error;
    }
  },*/

  // Get a specific Scheduled Bus Trip by ID (for user to view details before booking)
  getBusTripWithDetails: async (busTripId: number): Promise<BusTrip> => {
    try {
      const response = await publicApi.get<ApiResponse<BusTrip>>(ENDPOINTS.USER_SCHEDULED_BUS_TRIPS_ID(busTripId));
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },
};

export default BusTripService;