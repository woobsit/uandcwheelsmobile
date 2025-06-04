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

export const cleanExpiredPasswordResetTokens = async () => {
  try {
    const result = await db.PasswordResetToken.destroy({
      where: {
        created_at: {
          [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
        }
      }
    });
    
    logger.info(`Cleaned up ${result} expired password reset table`);
    return result;
  } catch (error) {
    logger.error('Failed to clean expired password reset table', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};