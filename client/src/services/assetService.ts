import { apiClient } from './api';
import {
  ApiResponse,
  Asset,
  AssetQueryParams,
  CreateAssetDto,
  PaginatedAssetsData,
  UpdateAssetDto,
} from '../types';

export const assetService = {
  /**
   * Fetch paginated, filtered, and searchable list of assets.
   */
  getAssets: async (params?: AssetQueryParams): Promise<ApiResponse<PaginatedAssetsData>> => {
    const response = await apiClient.get<ApiResponse<PaginatedAssetsData>>('/assets', {
      params,
    });
    return response.data;
  },

  /**
   * Fetch single asset details including wiping and disposal history.
   */
  getAssetById: async (id: string): Promise<ApiResponse<{ asset: Asset }>> => {
    const response = await apiClient.get<ApiResponse<{ asset: Asset }>>(`/assets/${id}`);
    return response.data;
  },

  /**
   * Register a new asset (ADMIN only).
   */
  createAsset: async (data: CreateAssetDto): Promise<ApiResponse<{ asset: Asset }>> => {
    const response = await apiClient.post<ApiResponse<{ asset: Asset }>>('/assets', data);
    return response.data;
  },

  /**
   * Update an existing asset's metadata (ADMIN only).
   */
  updateAsset: async (id: string, data: UpdateAssetDto): Promise<ApiResponse<{ asset: Asset }>> => {
    const response = await apiClient.put<ApiResponse<{ asset: Asset }>>(`/assets/${id}`, data);
    return response.data;
  },

  /**
   * Delete an asset (ADMIN only). Fails if workflow history exists (409 Conflict).
   */
  deleteAsset: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/assets/${id}`);
    return response.data;
  },
};
