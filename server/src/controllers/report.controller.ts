import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';
import { ApiResponse } from '../types';
import { ReportSummaryData } from '../types/report.types';

export class ReportController {
  /**
   * GET /api/v1/reports/summary
   * Returns live compliance and ESG audit summary statistics.
   */
  async getSummary(
    _req: Request,
    res: Response<ApiResponse<ReportSummaryData>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await reportService.getReportSummary();
      res.status(200).json({
        success: true,
        message: 'Report summary statistics retrieved successfully.',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/reports/export?type=...
   * Generates and downloads real dynamic CSV file.
   */
  async exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reportType = String(req.query.type || 'Complete_Disposition');
      const csv = await reportService.exportCsv(reportType);

      const filename = `AssetGuard_${reportType}_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
