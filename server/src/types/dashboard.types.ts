export interface DashboardSummary {
  totalAssets: number;
  wipingInProgress: number;
  verified: number;
  disposed: number;
}

export interface DashboardLifecycle {
  registered: number;
  wipingPending: number;
  wipingInProgress: number;
  wipingCompleted: number;
  verified: number;
  disposed: number;
}

export interface DashboardAssetType {
  type: string;
  count: number;
  percentage?: number;
  color?: string;
}

export interface DashboardRecentActivity {
  id: string;
  assetTag: string;
  action: string;
  status: string;
  timestamp: string | Date;
  assetType?: string;
  userName?: string;
  details?: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  lifecycle: DashboardLifecycle;
  assetTypes: DashboardAssetType[];
  recentActivity: DashboardRecentActivity[];
}
