// __tests__/auth.test.ts
import request from 'supertest';
import { app } from '../../app'; 
import dbInstance from '../../config/config';


// Use a describe block to group related tests and manage setup/teardown for this group
describe('Auth API Endpoints', () => {
  beforeEach(async () => {
    //await dbInstance.sync({ force: true }); // Uncomment if you want to reset DB before each test
  });

  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123'
  };

  const testLoginCredentials = {
    email: 'test@example.com',
    password: 'password123'
  };

  test('POST /api/v1/auth/register should create a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser); // Use the defined test user data

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Registration successful. Please check your email to verify your account.');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.email).toBe(testUser.email);
    // Don't expect password, it shouldn't be returned
    expect(response.body.data).not.toHaveProperty('password');
  });

  test('POST /api/v1/auth/login should return a token for a registered user', async () => {
    // This test needs a user to be registered *for this specific test*.
    // Since the previous test creates 'test@example.com', if `beforeEach` doesn't
    // clear the database, this will use the same user.
    // For better isolation, register a NEW user here or ensure beforeEach clears DB.
    // Let's register a unique user for this test to ensure isolation.
    const uniqueUser = {
      name: 'Login User',
      email: 'login.test@example.com', // Unique email
      password: 'loginpassword123',
      confirmPassword: 'loginpassword123'
    };

    await request(app)
      .post('/api/v1/auth/register')
      .send(uniqueUser); // Register the unique user for this login test

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: uniqueUser.email,
        password: uniqueUser.password
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
    expect(typeof response.body.data.token).toBe('string');
  });

  test('POST /api/v1/auth/register should return 409 for duplicate email', async () => {
    // Register the user first
    await request(app)
      .post('/api/v1/auth/register')
      .send(testUser); // Assuming this user was registered in a previous test or beforeEach

    // Try to register the same user again
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(response.status).toBe(409); // Assuming 409 Conflict for duplicate email
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Email already registered'); // Adjust based on your actual error message
  });

  test('POST /api/v1/auth/login should return 401 for invalid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401); // Assuming 401 Unauthorized
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid credentials'); // Adjust based on your actual error message
  });

});