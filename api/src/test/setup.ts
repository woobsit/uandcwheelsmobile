import { server } from '../app';
import dbInstance from '../config/config';
import logger from '../config/logger';

beforeAll(async () => {
  try {
    // For SQLite, just sync the schema
    await dbInstance.sync({ force: true });
  } catch (error) {
    logger.error('Test database setup failed', error);
    throw error;
  }
});

afterAll(async () => {
  await dbInstance.close();
  server.close();
});