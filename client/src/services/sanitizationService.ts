import { apiClient } from './api';
import {
  ApiResponse,
  CompleteWipingPayload,
  FailWipingPayload,
  SanitizationDetailData,
  SanitizationQueryParams,
  SanitizationQueueData,
  StartWipingPayload,
} from '../types';

export const sanitizationService = {
  /**
   * Fetch paginated queue of assets requiring or undergoing sanitization.
   */
  getQueue: async (
    params?: SanitizationQueryParams
  ): Promise<ApiResponse<SanitizationQueueData>> => {
    const response = await apiClient.get<ApiResponse<SanitizationQueueData>>(
      '/sanitization',
      {
        params,
      }
    );
    return response.data;
  },

  /**
   * Fetch complete wiping audit history for a specific asset.
   */
  getHistory: async (
    assetId: string
  ): Promise<ApiResponse<SanitizationDetailData>> => {
    const response = await apiClient.get<ApiResponse<SanitizationDetailData>>(
      `/sanitization/${assetId}`
    );
    return response.data;
  },

  /**
   * Start a wiping operation on an asset (IT_OFFICER only).
   */
  startWiping: async (
    assetId: string,
    payload?: StartWipingPayload
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/sanitization/${assetId}/start`,
      payload || {}
    );
    return response.data;
  },

  /**
   * Complete a wiping operation (IT_OFFICER only).
   */
  completeWiping: async (
    assetId: string,
    payload: CompleteWipingPayload
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/sanitization/${assetId}/complete`,
      payload
    );
    return response.data;
  },

  /**
   * Mark an active wiping operation as failed (IT_OFFICER only).
   */
  failWiping: async (
    assetId: string,
    payload: FailWipingPayload
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/sanitization/${assetId}/fail`,
      payload
    );
    return response.data;
  },
};
