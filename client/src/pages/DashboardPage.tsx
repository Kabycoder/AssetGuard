import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { KpiGrid } from '../components/dashboard/KpiGrid';
import { AssetLifecycle } from '../components/dashboard/AssetLifecycle';
import { StatusDonutChart } from '../components/dashboard/StatusDonutChart';
import { AssetTypeProgress } from '../components/dashboard/AssetTypeProgress';
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard';
import { QuickActionButtons } from '../components/dashboard/QuickActionButtons';
import { dashboardService } from '../services/dashboardService';
import {
  DashboardData,
  KpiCardData,
  LifecycleStage,
  StatusDistributionItem,
  QuickAction,
  AssetTypeBreakdown,
  ActivityItem,
  AssetCategory,
  AssetStatus,
} from '../types';

const defaultQuickActions: QuickAction[] = [
  {
    id: 'register-asset',
    label: 'Register Asset',
    icon: 'PlusCircle',
    variant: 'primary',
  },
  {
    id: 'start-wiping',
    label: 'Start Wiping',
    icon: 'PlayCircle',
    variant: 'secondary',
  },
  {
    id: 'verify-wipe',
    label: 'Verify Wipe',
    icon: 'CheckCircle2',
    variant: 'emerald',
  },
  {
    id: 'batch-disposal',
    label: 'Batch Disposal',
    icon: 'Archive',
    variant: 'amber',
  },
];

const typeColors = [
  'bg-indigo-600',
  'bg-blue-600',
  'bg-sky-500',
  'bg-teal-500',
  'bg-emerald-500',
  'bg-slate-500',
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }
    setError(null);

    try {
      const res = await dashboardService.getDashboard();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load dashboard data.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Unable to connect to AssetGuard server. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 45000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Transform raw API data into KPI Cards
  const kpiCards: KpiCardData[] = data
    ? [
        {
          id: 'total-assets',
          title: 'Total Assets',
          value: data.summary.totalAssets,
          formattedValue: data.summary.totalAssets.toLocaleString(),
          icon: 'HardDrive',
          accentColor: 'indigo',
        },
        {
          id: 'wiping-in-progress',
          title: 'Wiping In Progress',
          value: data.summary.wipingInProgress,
          formattedValue: data.summary.wipingInProgress.toLocaleString(),
          icon: 'RefreshCw',
          accentColor: 'blue',
        },
        {
          id: 'verified',
          title: 'Verified Clean',
          value: data.summary.verified,
          formattedValue: data.summary.verified.toLocaleString(),
          icon: 'ShieldCheck',
          accentColor: 'emerald',
        },
        {
          id: 'disposed',
          title: 'Disposed / COD',
          value: data.summary.disposed,
          formattedValue: data.summary.disposed.toLocaleString(),
          icon: 'Recycle',
          accentColor: 'amber',
        },
      ]
    : [];

  // Transform raw API data into Lifecycle Stages
  const lifecycleStages: LifecycleStage[] = data
    ? [
        {
          id: 'registered',
          name: 'Registered',
          count: data.lifecycle.registered + data.lifecycle.wipingPending,
          status: 'REGISTERED',
          color: '#4F46E5',
          bgColor: 'bg-indigo-50/50',
          borderColor: 'border-indigo-100',
        },
        {
          id: 'wiping',
          name: 'Sanitization',
          count: data.lifecycle.wipingInProgress + data.lifecycle.wipingCompleted,
          status: 'WIPING',
          color: '#2563EB',
          bgColor: 'bg-blue-50/50',
          borderColor: 'border-blue-100',
        },
        {
          id: 'verification',
          name: 'Verification',
          count: data.lifecycle.verified,
          status: 'VERIFIED',
          color: '#059669',
          bgColor: 'bg-emerald-50/50',
          borderColor: 'border-emerald-100',
        },
        {
          id: 'disposal',
          name: 'Disposal',
          count: data.lifecycle.disposed,
          status: 'DISPOSED',
          color: '#D97706',
          bgColor: 'bg-amber-50/50',
          borderColor: 'border-amber-100',
        },
      ]
    : [];

  // Transform raw API data into Status Donut Chart Distribution
  const statusDistribution: StatusDistributionItem[] = data
    ? [
        {
          name: 'Registered / Pending',
          status: 'REGISTERED',
          value: data.lifecycle.registered + data.lifecycle.wipingPending,
          percentage:
            data.summary.totalAssets > 0
              ? Math.round(
                  ((data.lifecycle.registered + data.lifecycle.wipingPending) /
                    data.summary.totalAssets) *
                    100
                )
              : 0,
          color: '#6366F1',
        },
        {
          name: 'Wiping In Progress',
          status: 'WIPING_IN_PROGRESS',
          value: data.lifecycle.wipingInProgress,
          percentage:
            data.summary.totalAssets > 0
              ? Math.round((data.lifecycle.wipingInProgress / data.summary.totalAssets) * 100)
              : 0,
          color: '#3B82F6',
        },
        {
          name: 'Wiping Completed',
          status: 'WIPING_COMPLETED',
          value: data.lifecycle.wipingCompleted,
          percentage:
            data.summary.totalAssets > 0
              ? Math.round((data.lifecycle.wipingCompleted / data.summary.totalAssets) * 100)
              : 0,
          color: '#F59E0B',
        },
        {
          name: 'Verified Clean',
          status: 'VERIFIED',
          value: data.lifecycle.verified,
          percentage:
            data.summary.totalAssets > 0
              ? Math.round((data.lifecycle.verified / data.summary.totalAssets) * 100)
              : 0,
          color: '#10B981',
        },
        {
          name: 'Disposed / Recycled',
          status: 'DISPOSED',
          value: data.lifecycle.disposed,
          percentage:
            data.summary.totalAssets > 0
              ? Math.round((data.lifecycle.disposed / data.summary.totalAssets) * 100)
              : 0,
          color: '#64748B',
        },
      ]
    : [];

  // Transform asset types breakdown
  const assetTypesBreakdown: AssetTypeBreakdown[] = data?.assetTypes
    ? data.assetTypes.map((item, idx) => ({
        type: item.type,
        category: (item.type.toLowerCase().includes('server')
          ? 'SERVER'
          : item.type.toLowerCase().includes('storage') || item.type.toLowerCase().includes('drive')
          ? 'STORAGE'
          : item.type.toLowerCase().includes('switch') || item.type.toLowerCase().includes('router')
          ? 'NETWORK'
          : 'COMPUTE') as AssetCategory,
        count: item.count,
        percentage:
          item.percentage !== undefined
            ? item.percentage
            : data.summary.totalAssets > 0
            ? Math.round((item.count / data.summary.totalAssets) * 100)
            : 0,
        color: item.color || typeColors[idx % typeColors.length],
      }))
    : [];

  // Transform recent activity items
  const recentActivities: ActivityItem[] = data?.recentActivity
    ? data.recentActivity.map((act) => {
        let type: ActivityItem['type'] = 'registered';
        const actionStr = (act.action || act.status || '').toLowerCase();
        if (actionStr.includes('wip') || actionStr.includes('saniti')) {
          type = 'wiping_started';
        } else if (actionStr.includes('verif')) {
          type = 'verified';
        } else if (actionStr.includes('dispos') || actionStr.includes('recyc')) {
          type = 'disposed';
        }

        const timeDiff = Date.now() - new Date(act.timestamp).getTime();
        const mins = Math.floor(timeDiff / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);
        const relativeTime =
          days > 0
            ? `${days}d ago`
            : hours > 0
            ? `${hours}h ago`
            : mins > 0
            ? `${mins}m ago`
            : 'Just now';

        return {
          id: act.id,
          type,
          title: act.action || 'Asset Status Update',
          assetId: act.assetTag,
          assetType: act.assetType || 'Device',
          timestamp: act.timestamp,
          relativeTime,
          status: (act.status as AssetStatus) || 'REGISTERED',
        };
      })
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, {user?.name || 'User'}. Here is your IT asset lifecycle status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 active:scale-95 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            className="text-xs font-semibold px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton or Content */}
      {loading && !data ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-28" />
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 h-36" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-64" />
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-64" />
          </div>
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <KpiGrid kpis={kpiCards} />

          {/* Asset Lifecycle Pipeline */}
          <AssetLifecycle stages={lifecycleStages} />

          {/* Analytics Section: Status Donut Chart & Asset Type Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusDonutChart
              data={statusDistribution}
              totalCount={data?.summary.totalAssets || 0}
            />
            <AssetTypeProgress types={assetTypesBreakdown} />
          </div>

          {/* Bottom Section: Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentActivityCard activities={recentActivities} />
            </div>
            <div className="lg:col-span-1 flex flex-col justify-start">
              <QuickActionButtons actions={defaultQuickActions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
