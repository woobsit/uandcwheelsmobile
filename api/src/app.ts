import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dbInstance from './config/database';
import passport from './config/passport';
import morganMiddleware from './config/morgan';
import { authRouter } from './routes/auth.routes';
import { errorHandler } from './middlewares/error-handler';



const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(errorHandler);

// Routes
app.use('/api/v1/auth', authRouter);

// Request logging
app.use(morganMiddleware);

// Database
dbInstance.sync()
  .then(() => console.log('Database synced'))
  .catch((error: Error) => console.error('Database sync failed:', error));

export default app;