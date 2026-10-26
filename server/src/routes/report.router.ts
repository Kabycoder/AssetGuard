import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';

export const reportRouter = Router();

/**
 * GET /api/v1/reports/summary
 * Protected endpoint returning live ESG & compliance summary metrics.
 */
reportRouter.get('/summary', authenticateToken, (req, res, next) => {
  reportController.getSummary(req, res, next);
});

/**
 * GET /api/v1/reports/export
 * Protected endpoint generating and streaming real audit CSV files.
 */
reportRouter.get('/export', authenticateToken, (req, res, next) => {
  reportController.exportReport(req, res, next);
});
