import { apiClient } from './api';
import { ApiResponse } from '../types';

export interface ReportSummaryData {
  totalAssets: number;
  disposedAssets: number;
  verifiedAssets: number;
  wipingCompletedAssets: number;
  diversionRate: number;
  complianceRate: number;
  chainOfCustodyReadiness: number;
}

export const reportService = {
  /**
   * Retrieves live ESG & compliance summary metrics.
   */
  getSummary: async (): Promise<ApiResponse<ReportSummaryData>> => {
    const response = await apiClient.get<ApiResponse<ReportSummaryData>>('/reports/summary');
    return response.data;
  },

  /**
   * Downloads dynamic CSV audit report directly from backend.
   */
  exportReport: async (reportType: string): Promise<void> => {
    const response = await apiClient.get(`/reports/export?type=${encodeURIComponent(reportType)}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `AssetGuard_${reportType}_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
