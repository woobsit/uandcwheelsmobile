export interface Bus {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'retired';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusData {
  plateNumber: string;
  brand: string;
  model: string;
  capacity: number;
  status?: 'active' | 'maintenance' | 'retired';
}