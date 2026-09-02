export type AssetStatus = 'REGISTERED' | 'WIPING' | 'VERIFIED' | 'DISPOSED';

export type AssetCategory = 'LAPTOP' | 'DESKTOP' | 'SERVER' | 'OTHER';

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
