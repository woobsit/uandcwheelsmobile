// src/middlewares/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from './../errors/app-error';
import logger from '../config/logger';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error(err.message, {
      statusCode: err.statusCode,
      details: err.details,
      stack: err.stack
    });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
  
  logger.error(errorMessage, {
    stack: err instanceof Error ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

