import type {Bus} from './bus'
import type {Driver} from './driver'

export interface BusTrip {
  id: number; // Based on your data, it's a number
  departure_time: string | Date; // Can be string from API, or Date object internally
  estimated_arrival: string | Date; // Can be string from API, or Date object internally
  fare: number; // This also seems to be directly on BusTrip
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';

  // These are the direct fields from your API response
  departure_location: string;
  departure_state: string;
  departure_terminal?: string; // If you want to use this
  arrival_location: string;
  arrival_state: string;
  arrival_terminal?: string; // If you want to use this

  bus: Bus; // Use the updated Bus interface
  driver: Driver; // Use the updated Driver interface
  available_seats: number;
}

export interface BusTripFilters {
  status?: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
  departureLocationName?: string;
  departureLocationState?: string;
  arrivalLocationName?: string;
  arrivalLocationState?: string;
  date?: string | Date; // This will be used as `departureDate` in the screens, sent as YYYY-MM-DD
  page?: number;
  limit?: number;
}

export interface AvailableDate {
  departureDate: string;
  minFare: number;
  maxFare: number;
  availableBusesCount: number;
}


// Defines the paginated structure of the response
export interface PaginatedAvailableDatesResponse {
  items: AvailableDate[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

// Define the parameters for the function
export interface GetAvailableDatesForRouteParams {
  departureLocationName: string;
  departureLocationState: string;
  arrivalLocationName: string;
  arrivalLocationState: string;
  page?: number; // Add optional page parameter
  limit?: number; // Add optional limit parameter
}

// This is the interface for a single available bus trip
export interface AvailableBus {
  id: number;
  available_seats: number;
  departure_time: string;
  fare: number;
  estimated_arrival: string;
  departure_terminal: string;
  arrival_terminal: string;
  bus_details: {
    plate_number: string;
    brand: string;
    capacity: number;
  };
}

// This defines the parameters for the new service function
export interface GetAvailableBusesForDateParams {
  page?: number;
  limit?: number;
  departureLocationName: string;
  departureLocationState: string;
  arrivalLocationName: string;
  arrivalLocationState: string;
  departureDate: string;
}

// This defines the structure of the API response
export interface PaginatedAvailableBusesResponse {
  items: AvailableBus[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}
