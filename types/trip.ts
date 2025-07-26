// Correct Trip interface to match backend response
export interface TripBase {
  id: string; // The ID of the route/template trip
  departure_location_id: string;
  arrival_location_id: string;
  estimated_arrival: string; // This is the estimated arrival for the *route*
  fare: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'; // Status of the route, perhaps less relevant for frontend display
  departure_terminal: string;
  arrival_terminal: string;
  createdAt: string;
  updatedAt: string;
  // Optional associations, if you ever fetch a 'Trip' directly for admin purposes
  departureLocation?: { name: string; id: string; state: string };
  arrivalLocation?: { name: string; id: string; state: string };
}


export interface TripFilters {
  from?: string;
  to?: string;
  date?: string | Date; // Allow both string and Date
  status?: string;
  page?: number;
  limit?: number;
}
