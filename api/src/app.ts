import express from 'express';
import dbInstance from './config/database';
import passport from './config/passport';
import morganMiddleware from './config/morgan';
import { authRouter } from './routes/auth.routes';
import logger from './config/logger';
import CronService from './services/cron.service';
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
  // Optionally exit the process
  // process.exit(1);
});

// Global error catcher for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  // Optionally exit the process
  // process.exit(1);
});

// Final fallback error handler (for any errors that slip through)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    // Don't exit if you want the app to run without DB (e.g., for read-only mode)
    // process.exit(1);
  });

export { app, server };  // Explicitly export both
