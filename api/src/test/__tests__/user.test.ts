import request from 'supertest';
import { app } from '../../app';
import dbInstance from '../../config/config';
import User from '../../models/user.model';
import logger from '../../config/logger';
import { createTestUser, getAuthToken } from '../test-utils/test-utils'; // We'll create these helpers

describe('User Management API Endpoints', () => {
  let testUser: User;
  let authToken: string;

  beforeAll(async () => {
    // Create a test user and get auth token before all tests
    testUser = await createTestUser({
      name: 'Test User',
      email: 'user.test@example.com',
      password: 'testpassword123'
    });
    authToken = await getAuthToken(testUser.email, 'testpassword123');
  });

  afterAll(async () => {
    // Clean up test data
    await User.destroy({ where: { email: 'user.test@example.com' } });
  });

  describe('GET /api/v1/users/me - Get current user profile', () => {
    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/users/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return current user profile with sensitive fields excluded', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        address: testUser.address,
        birth_date: testUser.birth_date,
        preferred_payment_method: testUser.preferred_payment_method,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('resetToken');
    });
  });

  describe('PATCH /api/v1/users/profile - Update user profile', () => {
    const validUpdateData = {
      phone: '+1234567890',
      address: '123 Test Street',
      birth_date: '1990-01-01',
      preferred_payment_method: 'credit_card'
    };

    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .patch('/api/v1/users/profile')
        .send(validUpdateData);

      expect(response.status).toBe(401);
    });

    test('should successfully update profile with valid data', async () => {
      const response = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validUpdateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        id: testUser.id,
        phone: validUpdateData.phone,
        address: validUpdateData.address,
        birth_date: validUpdateData.birth_date,
        preferred_payment_method: validUpdateData.preferred_payment_method
      });

      // Verify changes in database
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser?.phone).toBe(validUpdateData.phone);
      expect(updatedUser?.address).toBe(validUpdateData.address);
    });

    test('should allow partial updates', async () => {
      const partialUpdate = { phone: '+9876543210' };
      const response = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body.data.phone).toBe(partialUpdate.phone);
      // Other fields should remain unchanged
      expect(response.body.data.address).toBe(validUpdateData.address);
    });

    test('should validate phone number format', async () => {
      const response = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ phone: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'Phone must be between 10-15 characters'
        })
      );
    });

    test('should validate address length', async () => {
      const longAddress = 'a'.repeat(256);
      const response = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ address: longAddress });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'Address too long'
        })
      );
    });

    test('should validate date format', async () => {
      const response = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ birth_date: 'not-a-date' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'Invalid date format. Use YYYY-MM-DD'
        })
      );
    });

    test('should validate payment method', async () => {
      const response = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ preferred_payment_method: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          msg: 'Invalid payment method'
        })
      );
    });
  });
});