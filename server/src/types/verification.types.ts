import { AssetStatus, Role, VerificationStatus, WipingStatus } from '@prisma/client';

export interface VerificationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: AssetStatus | string;
  verificationStatus?: VerificationStatus | string;
  assetType?: string;
  department?: string;
}

export interface VerifyAssetDto {
  remarks?: string;
  checksumAuditPassed?: boolean;
}

export interface RejectVerificationDto {
  rejectionReason: string;
  remarks?: string;
}

export interface VerificationUserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface VerificationWipingRecord {
  id: string;
  assetId: string;
  technicianId: string;
  technician?: VerificationUserSummary;
  wipingMethod: string;
  wipingTool: string;
  status: WipingStatus;
  verificationStatus: VerificationStatus;
  remarks: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  verifiedAt: Date | null;
  verifiedById: string | null;
  verifiedBy?: VerificationUserSummary | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationAssetItem {
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
  wipingRecords: VerificationWipingRecord[];
  activeWipingRecord?: VerificationWipingRecord | null;
}

export interface PaginatedVerificationResponse {
  assets: VerificationAssetItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VerificationDetailResponse {
  asset: VerificationAssetItem;
  wipingRecords: VerificationWipingRecord[];
}
