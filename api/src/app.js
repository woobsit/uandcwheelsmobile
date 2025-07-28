const express = require('express');
const dbInstance = require('./config/config');
const passport = require('./middlewares/auth/passport');
const morganMiddleware = require('./config/morgan');
const logger = require('./config/logger');
const CronService = require('./jobs/authCronJobs/cron.service');
const { securityMiddlewares } = require('./middlewares/security');
const { globalRateLimiter } = require('./middlewares/rateLimiter');
const { createServer } = require('http');
const { authRouter } = require('./routes/auth.routes');
const { userRouter } = require('./routes/user.routes');
const { bookingRouter } = require('./routes/booking.routes');
const { busRouter } = require('./routes/bus.routes');
const { driverRouter } = require('./routes/driver.routes');
const { tripRouter } = require('./routes/trip.routes');
const { busTripRouter } = require('./routes/busTrip.routes');
const { locationRouter } = require('./routes/location.routes');
const { settingRouter } = require('./routes/setting.routes');

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
app.use('/api/v1/setting', settingRouter); // Add this line
app.use('/api/v1/user', userRouter); // Add this line
app.use('/api/v1/bus', busRouter);
app.use('/api/v1/driver', driverRouter);
app.use('/api/v1/trip', tripRouter);
app.use('/api/v1/bus-trip', busTripRouter);
app.use('/api/v1/booking', bookingRouter);
app.use('/api/v1/location', locationRouter);

// Global error catcher for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason.message || reason}`);
  // In production, you might want to terminate the process for unhandled rejections
  // process.exit(1);
});

// Global error catcher for uncaught exceptions
process.on('uncaughtException', error => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  // For uncaught exceptions, it's generally critical and advisable to exit
  // the process to avoid undefined behavior. Process managers like PM2 will restart it.
  process.exit(1);
});

// Final fallback error handler (for any errors that slip through)
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Ensure you send a response here
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

dbInstance
  .sync()
  .then(() => {
    CronService.init(); // Initialize cron jobs
    logger.info('Database synced successfully', CronService.getSchedules());
  })
  .catch(error => {
    logger.error('Database sync failed', { error: error.message });
    // Don't exit if you want the app to run without DB (e.g., for read-only mode)
    // process.exit(1);
  });

module.exports = { app, server };
