import dbInstance from '../config/config';
import logger from '../config/logger';

beforeAll(async () => {
  try {
   await dbInstance.sync({ force: true });
  } catch (error) {
    logger.error('Test database setup failed', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Close the database connection after all tests are done
    await dbInstance.close();
    logger.info('Test database connection closed');
  } catch (error) {
    logger.error('Test database teardown failed in afterAll', error);
    // It's good practice to log, but re-throwing might not be necessary
    // for teardown unless you want to explicitly fail the test run.
  }
});