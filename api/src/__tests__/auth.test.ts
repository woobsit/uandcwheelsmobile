// __tests__/auth.test.ts
import request from 'supertest';
import {app} from '../app';

describe('Auth Controller', () => {
  test('POST /register should create user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test('POST /login should return token', async () => {
    // First register
    await request(app)
      .post('/api/v1/auth/register')
      .send({/* registration data */});

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });
});