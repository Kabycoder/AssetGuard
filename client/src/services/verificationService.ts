import { apiClient } from './api';
import {
  ApiResponse,
  RejectVerificationPayload,
  VerificationDetailData,
  VerificationQueryParams,
  VerificationQueueData,
  VerifyAssetPayload,
} from '../types';

export const verificationService = {
  /**
   * Fetch paginated queue of assets awaiting or undergoing verification.
   */
  getQueue: async (
    params?: VerificationQueryParams
  ): Promise<ApiResponse<VerificationQueueData>> => {
    const response = await apiClient.get<ApiResponse<VerificationQueueData>>(
      '/verification',
      {
        params,
      }
    );
    return response.data;
  },

  /**
   * Fetch complete verification and wiping audit history for a specific asset.
   */
  getDetail: async (
    assetId: string
  ): Promise<ApiResponse<VerificationDetailData>> => {
    const response = await apiClient.get<ApiResponse<VerificationDetailData>>(
      `/verification/${assetId}`
    );
    return response.data;
  },

  /**
   * Admin approves and verifies data sanitization for an asset (ADMIN only).
   */
  verifyAsset: async (
    assetId: string,
    payload?: VerifyAssetPayload
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/verification/${assetId}/verify`,
      payload || {}
    );
    return response.data;
  },

  /**
   * Admin rejects data sanitization with a required reason (ADMIN only).
   */
  rejectAsset: async (
    assetId: string,
    payload: RejectVerificationPayload
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/verification/${assetId}/reject`,
      payload
    );
    return response.data;
  },
};
