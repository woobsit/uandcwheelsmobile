import jwt from 'jsonwebtoken';
import { UserPayload } from '../../types/user.interface';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (payload: UserPayload, tokenExpiration: string): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: tokenExpiration } as jwt.SignOptions );
};

export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
};

