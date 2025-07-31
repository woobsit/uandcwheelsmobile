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