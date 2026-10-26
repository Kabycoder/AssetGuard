import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { ApiResponse } from '../types';
import { DashboardData } from '../types/dashboard.types';

export class DashboardController {
  /**
   * GET /api/v1/dashboard
   * Returns aggregated real-time dashboard data with Redis caching and role awareness.
   */
  async getDashboard(
    req: Request,
    res: Response<ApiResponse<DashboardData>>,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required to access dashboard metrics.',
        });
        return;
      }

      const data = await dashboardService.getDashboardData({
        id: req.user.userId,
        role: req.user.role,
      });

      res.status(200).json({
        success: true,
        message: 'Dashboard metrics retrieved successfully.',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
