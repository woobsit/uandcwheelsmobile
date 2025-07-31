// types/passenger.ts

// Defines the structure of passenger data as expected by the backend when creating a booking
export interface PassengerPayload {
  name: string;
  age: number;
  type: 'adult' | 'lap-child' | 'seated-child'; // Matches ENUM in backend model
  requires_seat: boolean; // Derived from 'type' on frontend, but sent to backend
  is_on_lap: boolean; // Derived from 'type' on frontend, but sent to backend
  next_of_kin_name: string;
  next_of_kin_phone: string;
  next_of_kin_relationship: string;
  seat_number?: string; // Assigned during seat selection, optional for lap-children
  is_primary?: boolean; // True for the main passenger/booker, optional as backend can infer
}

// If you need a full representation for *retrieving* passengers from the backend
// (e.g., when viewing booking details), it would look like this:
export interface Passenger {
  id: number;
  booking_id: number;
  name: string;
  age: number;
  type: 'adult' | 'lap-child' | 'seated-child';
  requires_seat: boolean;
  is_on_lap: boolean;
  next_of_kin_name: string;
  next_of_kin_phone: string;
  next_of_kin_relationship: string;
  seat_number?: string;
  is_primary: boolean;
  createdAt: string;
  updatedAt: string;
}