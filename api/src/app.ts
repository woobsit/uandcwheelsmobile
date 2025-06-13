import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import dbInstance from './config/config';
import passport from './middlewares/auth/passport';
import morganMiddleware from './config/morgan';
import logger from './config/logger';
import CronService from './jobs/authCronJobs/cron.service';
import { securityMiddlewares } from './middlewares/security';
import { globalRateLimiter } from './middlewares/rateLimiter';
import { createServer } from 'http';
import { authRouter } from './routes/auth.routes';
import {userRouter} from './routes/user.routes';
import bookingRouter from './routes/booking.routes';


const app = express();
const server = createServer(app);

// Add body parsers early, before routes that might need them
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(globalRateLimiter);
app.use(securityMiddlewares);
app.use(passport.initialize());
app.use(morganMiddleware);

// Routes
// It's good practice to place the routes after all general middlewares

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter); // Add this line

app.use('/api/v1/bookings', bookingRouter);


// Global error catcher for unhandled rejections
process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason.message || reason}`);
  // In production, you might want to terminate the process for unhandled rejections
  // process.exit(1);
});

// Global error catcher for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  // For uncaught exceptions, it's generally critical and advisable to exit
  // the process to avoid undefined behavior. Process managers like PM2 will restart it.
  process.exit(1);
});

// Final fallback error handler (for any errors that slip through)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Ensure you send a response here
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

dbInstance.sync()
  .then(() => {

    CronService.init(); // Initialize cron jobs
    logger.info('Database synced successfully', CronService.getSchedules());
  })
  .catch((error: Error) => {
    logger.error('Database sync failed', { error: error.message });
    // Don't exit if you want the app to run without DB (e.g., for read-only mode)
    // process.exit(1);
  });

export { app, server }