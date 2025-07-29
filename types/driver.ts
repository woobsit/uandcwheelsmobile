export interface Driver {
  id?: string; // Add id as optional string if your backend uses it
  name: string;
  license_number: string; // Changed from licenseNumber to license_number for consistency
  phone?: string; // Added from your Driver type
  years_of_experience?: number; // Added from your Driver type, changed to snake_case
  status?: 'active' | 'on_leave' | 'retired'; // Added from your Driver type
  createdAt?: string; // Added from your Driver type
  updatedAt?: string; // Added from your Driver type
}
export interface CreateDriverData {
  name: string;
  licenseNumber: string;
  phone: string;
  yearsOfExperience: number;
  status?: 'active' | 'on_leave' | 'retired';
}
