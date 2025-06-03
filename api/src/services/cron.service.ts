// src/services/cron.service.ts
import cron from 'node-cron';
import { cleanExpiredRegistrations } from '../jobs/cleanExpiredRegistrations';
import logger from '../config/logger';

class CronService {
  static init() {
    // Run daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
      logger.info('Running expired registration cleanup');
      try {
        await cleanExpiredRegistrations();
      } catch (error) {
        logger.error('Cron job failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    logger.info('Cron jobs initialized');
  }
}

export default CronService;