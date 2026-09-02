import { AssetStatus } from '@prisma/client';

export interface CreateAssetDto {
  assetTag: string;
  serialNumber: string;
  assetType: string;
  brand?: string;
  model?: string;
  department?: string;
  purchaseDate?: string | Date | null;
}

export interface UpdateAssetDto {
  assetTag?: string;
  serialNumber?: string;
  assetType?: string;
  brand?: string;
  model?: string;
  department?: string;
  purchaseDate?: string | Date | null;
}

export interface AssetQueryParams {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: AssetStatus;
  assetType?: string;
  department?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedAssetResponse {
  assets: any[];
  pagination: PaginationMeta;
}
