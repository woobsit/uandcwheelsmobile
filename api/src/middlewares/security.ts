import express, { RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';

export const securityMiddlewares: RequestHandler[] = [
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
    credentials: true,
  }),
  helmet(),
  express.json(),
  express.urlencoded({ extended: true }),
];
