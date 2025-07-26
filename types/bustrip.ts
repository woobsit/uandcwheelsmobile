// New BusTrip interface - This is what your frontend will primarily display and interact with for bookings
export interface BusTrip {
  id: string; // This is the ID of the BusTrip
  bus_id: string;
  driver_id: string;
  trip_id: string; // The ID of the associated Trip (route)
  available_seats: number;
  departure_time: string;
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
  createdAt: string;
  updatedAt: string;

  // Nested associated data from the backend
  bus: {
    id: string;
    plate_number: string;
    brand: string;
    capacity: number;
  };
  driver: {
    id: string;
    name: string;
    license_number: string;
    phone?: string; // Add phone if it's included in driver details
  };
  trip: {
    id: string;
    estimated_arrival: string; // Estimated arrival for this specific bus trip
    fare: number;
    departure_terminal: string;
    arrival_terminal: string;
    departureLocation: {
      id: string;
      name: string;
      state: string;
    };
    arrivalLocation: {
      id: string;
      name: string;
      state: string;
    };
  };
}

// Update your TripFilters to reflect BusTrip filtering
export interface BusTripFilters {
  departureLocationName?: string;
  departureLocationState?: string;
  arrivalLocationName?: string;
  arrivalLocationState?: string;
  date?: string; // For filtering by departure_time on a specific date
  status?: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled'; // If you need to filter by BusTrip status
  page?: number;
  limit?: number;
}