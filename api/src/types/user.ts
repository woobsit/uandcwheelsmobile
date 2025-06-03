export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  remember_token: string;
  email_verified_at?: Date;
  verification_token: string;
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