import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dbInstance from './config/database';
import passport from './config/passport';
import { authRouter } from './routes/auth.routes';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());

// Routes
app.use('/api/v1/auth', authRouter);


// Database
dbInstance.sync()
  .then(() => console.log('Database synced'))
  .catch((error: Error) => console.error('Database sync failed:', error));

export default app;