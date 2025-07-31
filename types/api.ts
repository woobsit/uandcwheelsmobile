// Generic API response format
export interface ApiResponse<T> {
  success: boolean;
  message?: string; // Often included in API responses
  data: T; // <-- This is the correct structure
}
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  totalPages?: number;
}
