// Correct Trip interface to match backend response
export interface Trip {
  id: string;
  busId: string;
  driverId: string;
  departure_location_id: string; // Match database column
  arrival_location_id: string; // Match database column
  departure_time: string; // Match database column
  estimated_arrival: string; // Match database column
  fare: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;

  // Added from backend formatting
  departure_location?: string;
  arrival_location?: string;
  Bus?: {
    plate_number: string;
    brand: string;
    capacity: number;
  };
  Driver?: {
    name: string;
    license_number: string;
  };
}

export interface TripFilters {
  from?: string;
  to?: string;
  date?: string | Date; // Allow both string and Date
  status?: string;
  page?: number;
  limit?: number;
}
