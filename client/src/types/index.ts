export type AssetStatus =
  | 'REGISTERED'
  | 'WIPING_PENDING'
  | 'WIPING_IN_PROGRESS'
  | 'WIPING_COMPLETED'
  | 'VERIFIED'
  | 'DISPOSED'
  | 'WIPING'; // preserved for dashboard compatibility

export type AssetCategory = 'LAPTOP' | 'DESKTOP' | 'SERVER' | 'OTHER';

export interface WipingRecordSummary {
  id: string;
  wipingMethod: string;
  wipingTool: string;
  status: string;
  verificationStatus: string;
  remarks?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  technician?: { id: string; name: string; email: string; role: string };
  verifiedBy?: { id: string; name: string; email: string; role: string };
}

export interface DisposalRecordSummary {
  id: string;
  disposalMethod: string;
  vendorName?: string | null;
  certificateNumber?: string | null;
  remarks?: string | null;
  disposedAt: string;
  createdAt: string;
  officer?: { id: string; name: string; email: string; role: string };
}

export interface Asset {
  id: string;
  assetTag: string;
  serialNumber: string;
  assetType: string;
  brand: string;
  model: string;
  department: string;
  purchaseDate?: string | null;
  status: AssetStatus;
  createdAt: string;
  updatedAt: string;
  wipingRecords?: WipingRecordSummary[];
  disposalRecords?: DisposalRecordSummary[];
}

export interface CreateAssetDto {
  assetTag: string;
  serialNumber: string;
  assetType: string;
  brand?: string;
  model?: string;
  department?: string;
  purchaseDate?: string | null;
}

export interface UpdateAssetDto {
  assetTag?: string;
  serialNumber?: string;
  assetType?: string;
  brand?: string;
  model?: string;
  department?: string;
  purchaseDate?: string | null;
}

export interface AssetQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  assetType?: string;
  department?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedAssetsData {
  assets: Asset[];
  pagination: PaginationMeta;
}

export interface KpiCardData {
  id: string;
  title: string;
  value: number;
  formattedValue: string;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: string;
  accentColor: 'indigo' | 'blue' | 'emerald' | 'amber';
}

export interface LifecycleStage {
  id: string;
  name: string;
  count: number;
  status: AssetStatus;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface StatusDistributionItem {
  name: string;
  status: AssetStatus;
  value: number;
  percentage: number;
  color: string;
}

export interface AssetTypeBreakdown {
  type: string;
  category: AssetCategory;
  count: number;
  percentage: number;
  color: string;
}

export interface ActivityItem {
  id: string;
  type: 'registered' | 'wiping_started' | 'verified' | 'disposed';
  title: string;
  assetId: string;
  assetType: string;
  timestamp: string;
  relativeTime: string;
  status: AssetStatus;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'emerald' | 'amber';
}

export type Role = 'ADMIN' | 'IT_OFFICER' | 'DISPOSAL_OFFICER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponseData {
  token: string;
  user: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
