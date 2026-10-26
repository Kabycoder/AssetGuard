import { AssetStatus, Role, VerificationStatus, WipingStatus } from '@prisma/client';

export interface SanitizationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: AssetStatus | string;
  wipingStatus?: WipingStatus | string;
  assetType?: string;
  department?: string;
}

export interface StartWipingDto {
  wipingMethod?: string;
  wipingTool?: string;
  remarks?: string;
}

export interface CompleteWipingDto {
  wipingMethod: string;
  wipingTool: string;
  remarks?: string;
}

export interface FailWipingDto {
  reason?: string;
  remarks?: string;
}

export interface SanitizationTechnicianSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface SanitizationWipingRecord {
  id: string;
  assetId: string;
  technicianId: string;
  technician?: SanitizationTechnicianSummary;
  wipingMethod: string;
  wipingTool: string;
  status: WipingStatus;
  verificationStatus: VerificationStatus;
  remarks: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  verifiedAt: Date | null;
  verifiedBy?: SanitizationTechnicianSummary | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SanitizationAssetItem {
  id: string;
  assetTag: string;
  serialNumber: string;
  assetType: string;
  brand: string;
  model: string;
  department: string;
  purchaseDate: Date | null;
  status: AssetStatus;
  createdAt: Date;
  updatedAt: Date;
  wipingRecords: SanitizationWipingRecord[];
  activeWipingRecord?: SanitizationWipingRecord | null;
}

export interface PaginatedSanitizationResponse {
  assets: SanitizationAssetItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SanitizationDetailResponse {
  asset: SanitizationAssetItem;
  wipingRecords: SanitizationWipingRecord[];
}
