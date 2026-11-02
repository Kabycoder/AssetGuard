import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { apiRouter } from './routes/api.router';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { apiLimiter } from './middleware/rateLimiter';

export const createApp = (): Application => {
  const app: Application = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!config.isProduction || !origin) {
          return callback(null, true);
        }
        const allowedOrigins = config.clientUrl.split(',').map((u) => u.trim());
        if (
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes('*') ||
          origin.endsWith('.vercel.app')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    })
  );

  // Body Parsing Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root & Direct Health Check Endpoints
  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'AssetGuard Enterprise IT Asset Lifecycle Management API',
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/v1/health',
        api: '/api/v1',
      },
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // API Rate Limiting
  app.use('/api/v1', apiLimiter);

  // API Routes
  app.use('/api/v1', apiRouter);

  // 404 Handler
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
