export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  yearsOfExperience: number;
  status: 'active' | 'on_leave' | 'retired';
  createdAt: string;
  updatedAt: string;
}

export interface CreateDriverData {
  name: string;
  licenseNumber: string;
  phone: string;
  yearsOfExperience: number;
  status?: 'active' | 'on_leave' | 'retired';
}
