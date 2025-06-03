// src/jobs/cleanExpiredRegistrations.ts
import db from '../models';
import logger from '../config/logger';
import { Op } from 'sequelize';

export const cleanExpiredRegistrations = async () => {
  try {
    const result = await db.User.destroy({
      where: {
        email_verified_at: null,
        verification_token_expires: {
          [Op.lt]: new Date()
        }
      }
    });
    
    logger.info(`Cleaned up ${result} expired registrations`);
    return result;
  } catch (error) {
    logger.error('Failed to clean expired registrations', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};