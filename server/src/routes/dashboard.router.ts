import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth.middleware';

export const dashboardRouter = Router();

/**
 * GET /api/v1/dashboard
 * Protected endpoint returning real-time MongoDB analytics with Redis caching.
 */
dashboardRouter.get('/', authenticateToken, (req, res, next) => {
  dashboardController.getDashboard(req, res, next);
});
