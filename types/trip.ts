export interface Trip {
  id: string;
  busId: string;
  driverId: string;
  departureLocationId: string;
  arrivalLocationId: string;
  departureTime: string;
  estimatedArrival: string;
  fare: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface TripFilters {
  from?: string;
  to?: string;
  date?: string;
  status?: string;
  page?: number;
  limit?: number;
}
