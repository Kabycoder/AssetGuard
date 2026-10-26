import { apiClient } from './api';
import { ApiResponse, DashboardData } from '../types';

export const dashboardService = {
  /**
   * Fetches real aggregated dashboard analytics from MongoDB via Redis cache.
   */
  getDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    const response = await apiClient.get<ApiResponse<DashboardData>>('/dashboard');
    return response.data;
  },
};
