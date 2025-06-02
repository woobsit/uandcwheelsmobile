import { Request } from 'express';
import morgan from 'morgan';
import logger from './logger';

// Custom morgan token to include request body (with redaction)
morgan.token('body', (req: Request) => {
  const body = { ...req.body };
  // Redact sensitive fields
  ['password', 'token'].forEach(field => {
    if (body[field]) body[field] = '***REDACTED***';
  });
  return JSON.stringify(body);
});

const morganMiddleware = morgan(
  ':method :url :status :response-time ms - :res[content-length] - :body',
  { 
    stream: {
      write: (message) => logger.http(message.trim())
    }
  }
);

export default morganMiddleware;