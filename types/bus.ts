// types/bustrip.ts
export interface Bus {
  id?: string; // Add id as optional string if your backend uses it
  plate_number: string; // Changed from plateNumber to plate_number for consistency with API log
  brand: string;
  model?: string; // Added model from your Bus type, make optional if not always present
  capacity: number;
  status?: 'active' | 'maintenance' | 'retired'; // Added status from your Bus type
  createdAt?: string; // Added from your Bus type
  updatedAt?: string; // Added from your Bus type
}


export interface CreateBusData {
  plateNumber: string;
  brand: string;
  model: string;
  capacity: number;
  status?: 'active' | 'maintenance' | 'retired';
}
