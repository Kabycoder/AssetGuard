import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Unhandled server error:', err.message, err.stack);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: config.isProduction ? undefined : err.message,
  });
};
