import User from '../../models/user.model';
import request from 'supertest';
import { app } from '../../app';

export async function createTestUser(userData: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const user = await User.create({
    ...userData,
    email_verified_at: new Date() // Mark as verified
  });
  return user;
}

export async function getAuthToken(email: string, password: string): Promise<string> {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  
  if (response.status !== 200) {
    throw new Error(`Failed to get auth token: ${response.body.message}`);
  }
  
  return response.body.data.token;
}