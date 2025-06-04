// src/test/setup.ts
import { server } from '../app';
import db from '../models';
import logger from '../config/logger';

beforeAll(async () => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    // Wipe and recreate tables
    await db.sequelize.sync({ force: true }); 
  } catch (error) {
    logger.error('Test database setup failed', error);
    throw error; // Fail the test run
  }
});

afterAll(async () => {
  await db.sequelize.close();
  server.close();
});