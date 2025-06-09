// src/services/cron.service.ts
import cron from 'node-cron';
import { cleanExpiredRegistrations, cleanExpiredPasswordResetTokens } from '../jobs/cleanExpiredRegistrations';
import logger from '../config/logger';

class CronService {
  static init() {
    // Run daily at 3 AM
    cron.schedule(process.env.CLEAN_REGISTRATIONS_SCHEDULE || '0 3 * * *', async () => {
      logger.info('Running expired registration cleanup');
      try {
        await cleanExpiredRegistrations();
      } catch (error) {
        logger.error('Cron job failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

      cron.schedule(process.env.CLEAN_PASSWORD_TOKENS_SCHEDULE || '0 * * * *', async () => {
      logger.info('Running expired password reset tokens cleanup');
      try {
        await cleanExpiredPasswordResetTokens();
      } catch (error) {
        logger.error('Password token cleanup failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    logger.info('Cron jobs initialized');
  }

  static getSchedules() {
    return {
      registrations: process.env.CLEAN_REGISTRATIONS_SCHEDULE || '0 3 * * *',
      passwordTokens: process.env.CLEAN_PASSWORD_TOKENS_SCHEDULE || '0 * * * *'
    };
  }
}

export default CronService;