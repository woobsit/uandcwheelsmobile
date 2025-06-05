export interface User {
  id: number;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserPayload {
  id: number;
  email: string;
  role?: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'password'>;
}