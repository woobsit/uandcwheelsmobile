import express, { Request, Response, NextFunction } from 'express';
import dbInstance from './config/config';
import passport from './middlewares/auth/passport';
import morganMiddleware from './config/morgan';
import { authRouter } from './routes/auth.routes';
import logger from './config/logger';
import CronService from './jobs/authCronJobs/cron.service';
import { securityMiddlewares } from './middlewares/security';
import { globalRateLimiter } from './middlewares/rateLimiter';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

// Middleware
app.use(globalRateLimiter); // Apply globally
app.use(securityMiddlewares);
app.use(passport.initialize());
app.use(morganMiddleware);

// Routes
app.use('/api/v1/auth', authRouter);

// Global error catcher for unhandled rejections
process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason.message || reason}`);
});

// Global error catcher for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
});

// Final fallback error handler (for any errors that slip through)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { 
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Database
dbInstance.sync()
  .then(() => {
    CronService.init(); // Initialize cron jobs
    logger.info('Database synced successfully', CronService.getSchedules());
  })
  .catch((error: Error) => {
    logger.error('Database sync failed', { error: error.message });
  });

export { app, server };