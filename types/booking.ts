// types/booking.ts

// Booking Status Enum
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  REFUNDED = 'refunded',
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
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  MOBILE_MONEY = 'mobile_money',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
}

// Passenger Type
export interface Passenger {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date | string;
  specialNeeds?: string;
  nationality: string;
  passportNumber?: string;
}

// Trip Details
export interface Trip {
  id: number;
  departureLocation: string;
  arrivalLocation: string;
  departureTime: Date | string;
  arrivalTime: Date | string;
  duration: number; // in minutes
  vehicleType: string;
  operator: string;
  price: number;
}

// Booking Type
export interface Booking {
  id: number;
  userId: number;
  tripId: number;
  bookingDate: Date | string;
  amountPaid: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentDate?: Date | string;
  transactionId?: string;
  cancellationDate?: Date | string;
  refundAmount?: number;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Optional nested objects (for API responses)
  trip?: Trip;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

// API Response Types
export interface BookingResponse {
  success: boolean;
  message: string;
  data: Booking | Booking[];
  pagination?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface CreateBookingRequest {
  tripId: number;
  passengers: Omit<Passenger, 'id'>[];
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface UpdateBookingRequest {
  bookingId: number;
  bookingStatus?: BookingStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
}

// Filtering Options
export interface BookingFilterOptions {
  userId?: number;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  startDate?: Date | string;
  endDate?: Date | string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'bookingDate' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}
