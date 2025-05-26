import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import authRouter from './app/routes/auth.routes.js';
import { sequelize } from './app/config/database.js';

const app = express();

// Middleware
app.use(cors());
app.use(json());

// Database
await sequelize.sync();

// Routes
app.use('/api/auth', authRouter);

export default app;