import api from './axiosInstance';
import { ENDPOINTS } from '../constants/api';
import { ApiResponse } from '../types/api';
import { CreateBookingPayload } from '../types/booking';

export interface Booking {
  id: number;
  userId: string;
  tripId: string;
  seats: number[];
  totalAmount: number;
  booking_reference: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  tripId: string;
  seats: number[];
  paymentMethod: string;
}

const BookingService = {
  createBooking: async (bookingData: CreateBookingPayload): Promise<ApiResponse<Booking>> => {
    try {
      const response = await api.post<ApiResponse<Booking>>(ENDPOINTS.BOOKINGS, bookingData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getBookingById: async (bookingId: string): Promise<ApiResponse<Booking>> => {
    try {
      const response = await api.get<ApiResponse<Booking>>(ENDPOINTS.BOOKING_DETAILS(bookingId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUserBookings: async (userId: string): Promise<ApiResponse<Booking[]>> => {
    try {
      const response = await api.get<ApiResponse<Booking[]>>(ENDPOINTS.BOOKINGS, {
        params: { userId },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  cancelBooking: async (bookingId: string): Promise<ApiResponse<Booking>> => {
    try {
      const response = await api.delete<ApiResponse<Booking>>(ENDPOINTS.BOOKING_DETAILS(bookingId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default BookingService;
