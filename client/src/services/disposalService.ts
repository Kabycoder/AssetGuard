import { apiClient } from './api';
import {
  ApiResponse,
  CreateDisposalPayload,
  DisposalQueryParams,
  DisposalQueueData,
} from '../types';

export const disposalService = {
  /**
   * Fetch paginated queue of verified assets awaiting disposal and historical records.
   */
  getQueue: async (
    params?: DisposalQueryParams
  ): Promise<ApiResponse<DisposalQueueData>> => {
    const response = await apiClient.get<ApiResponse<DisposalQueueData>>(
      '/disposal',
      { params }
    );
    return response.data;
  },

  /**
   * Fetch disposal details and audit trail for a specific asset.
   */
  getDetail: async (assetId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(
      `/disposal/${assetId}`
    );
    return response.data;
  },

  /**
   * Record asset disposition (ADMIN, DISPOSAL_OFFICER).
   */
  recordDisposal: async (
    assetId: string,
    payload: CreateDisposalPayload
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/disposal/${assetId}`,
      payload
    );
    return response.data;
  },
};
