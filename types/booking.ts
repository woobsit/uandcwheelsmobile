import { Passenger, PassengerPayload } from './passenger'; // Use the new Passenger types
import { BusTrip } from './bustrip'; // For including bus trip details in response
import { User } from './auth'; // Assuming you have a User type

// Booking Status Enum
export enum BookingStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

// Payment Status Enum
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

// Payment Method Enum
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
}

// Type for creating a new booking (payload sent to backend)
export interface CreateBookingPayload {
  user_id?: number; // Optional, if user is logged in and not guest
  outbound_bus_trip_id: number;
  return_bus_trip_id?: number; // Optional for round trips
  total_amount: number; // Calculated on frontend based on fare * number of seats
  payment_method: PaymentMethod; // From common enum
  notes?: string;
  adult_count: number;
  lap_child_count: number;
  seated_child_count: number;
  is_guest: boolean;
  guest_email?: string; // Required if is_guest is true
  emergency_contact_name?: string; // Optional (could be part of primary passenger instead)
  emergency_contact_phone?: string; // Optional (could be part of primary passenger instead)
  passengers: PassengerPayload[]; // Array of passenger details for the trip
}

// Type for a Booking as returned from the API (full model)
// This mirrors your `booking.model.js`'s fields
export interface Booking {
  id: number;
  user_id?: number;
  outbound_bus_trip_id: number;
  return_bus_trip_id?: number;
  booking_reference: string;
  booking_date: string; // API will return as string
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  total_amount: number;
  amount_paid: number;
  status: BookingStatus;
  notes?: string;
  adult_count: number;
  lap_child_count: number;
  seated_child_count: number;
  is_guest: boolean;
  guest_email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Associations (as included by Sequelize in backend, if fetched)
  outbound_bus_trip?: BusTrip;
  return_bus_trip?: BusTrip;
  user?: User; // Define User type if not already
  passengers?: Passenger[]; // Array of associated Passenger objects
}

// No longer need BookingResponse and CreateBookingRequest/UpdateBookingRequest from your old file.
// ApiResponse<Booking> will handle single booking responses.
// ApiResponse<PaginatedResponse<Booking>> will handle list responses.
// CreateBookingPayload is the request body.

// Filtering Options (Similar to your existing, but adjusted)
export interface BookingFilterOptions {
  userId?: number;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string; // Pass dates as 'YYYY-MM-DD' strings
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'bookingDate' | 'totalAmount'; // Align with model field names if used
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number; // Consistency
}