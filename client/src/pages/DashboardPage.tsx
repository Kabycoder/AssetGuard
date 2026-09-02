import React from 'react';
import { KpiGrid } from '../components/dashboard/KpiGrid';
import { AssetLifecycle } from '../components/dashboard/AssetLifecycle';
import { StatusDonutChart } from '../components/dashboard/StatusDonutChart';
import { AssetTypeProgress } from '../components/dashboard/AssetTypeProgress';
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard';
import { QuickActionButtons } from '../components/dashboard/QuickActionButtons';
import {
  mockKpis,
  mockLifecycleStages,
  mockStatusDistribution,
  mockAssetTypes,
  mockRecentActivities,
  mockQuickActions,
} from '../utils/mockData';

export const DashboardPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top KPI Cards */}
      <KpiGrid kpis={mockKpis} />

      {/* Asset Lifecycle Pipeline */}
      <AssetLifecycle stages={mockLifecycleStages} />

      {/* Analytics Section: Status Donut Chart & Asset Type Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusDonutChart data={mockStatusDistribution} totalCount={1248} />
        <AssetTypeProgress types={mockAssetTypes} />
      </div>

      {/* Bottom Section: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivityCard activities={mockRecentActivities} />
        </div>
        <div className="lg:col-span-1 flex flex-col justify-start">
          <QuickActionButtons actions={mockQuickActions} />
        </div>
      </div>
    </div>
  );
};
