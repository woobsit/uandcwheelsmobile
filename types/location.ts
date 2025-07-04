export interface Location {
  id: string;
  name: string;
  code: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationData {
  name: string;
  code?: string;
  timezone?: string;
}
