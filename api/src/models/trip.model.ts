// models/trip.model.ts
interface TripAttributes {
  id: number;
  bus_id: number;
  departure_location: string;
  arrival_location: string;
  departure_time: Date;
  estimated_arrival: Date;
  fare: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}
// ...similar implementation