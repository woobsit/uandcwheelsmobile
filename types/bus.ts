// types/bustrip.ts
export interface Bus {
  id?: number; // Add id as optional string if your backend uses it
  plate_number: string; // Changed from plateNumber to plate_number for consistency with API log
  brand: string;
  model?: string; // Added model from your Bus type, make optional if not always present
  capacity: number;
  status?: 'active' | 'maintenance' | 'retired'; // Added status from your Bus type
  seat_arrangement?: string; // e.g., "2-2" for how seats are laid out
  taken_seats?: string[]; // Array of seat numbers that are already booked, e.g., ["A1", "B2", "C3"]
  createdAt?: string; // Added from your Bus type
  updatedAt?: string; // Added from your Bus type
}

// The `CreateBusData` is for creating a new Bus entry in the admin panel.
// Keep it if you have an admin interface for creating buses.
// It should match your backend's expected input for bus creation.
export interface CreateBusData {
  plate_number: string; // Corrected field name
  brand: string;
  model: string;
  capacity: number;
  status?: 'active' | 'maintenance' | 'retired';
}