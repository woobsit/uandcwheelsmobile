const User = require('../../models/user.model');
const request = require('supertest');
const { app } = require('../../app');

async function createTestUser(userData) {
  const user = await User.create({
    ...userData,
    email_verified_at: new Date(), // Mark as verified
  });
  return user;
}

async function getAuthToken(email, password) {
  const response = await request(app).post('/api/v1/auth/login').send({ email, password });

  if (response.status !== 200) {
    throw new Error(`Failed to get auth token: ${response.body.message}`);
  }

  return response.body.data.token;
}

module.exports = { createTestUser, getAuthToken };
