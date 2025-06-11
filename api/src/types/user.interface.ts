import type { Options } from 'sequelize'; // Import Options type for better typing

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
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface DbConfig extends Options {
  username?: string;
  password?: string;
  database?: string;
  host?: string;
  dialect: 'mysql'; // Explicitly define dialect as 'mysql'
  logging?: boolean | ((sql: string, timing?: number) => void); // Add logging property
  dialectOptions?: {
    charset: string;
  };
}

export declare namespace Express {
  interface User {
    id: number;
    email: string;
    // Add other user properties as needed
  }
}

export interface IUserProfile {
  phone?: string;
  address?: string;
  birth_date?: Date | string;
  preferred_payment_method?: 'credit_card' | 'paypal' | 'bank_transfer' | 'cash';
}