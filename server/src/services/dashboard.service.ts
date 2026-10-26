import { Role, AssetStatus, WipingStatus, VerificationStatus } from '@prisma/client';
import { prisma, config, getCache, setCache } from '../config';
import {
  DashboardData,
  DashboardSummary,
  DashboardLifecycle,
  DashboardAssetType,
  DashboardRecentActivity,
} from '../types/dashboard.types';
import { logger } from '../utils/logger';
import {
  fallbackAssets,
  shouldTryDb,
  handleDbSuccess,
  handleDbFailure,
  getFallbackRecentActivity,
} from '../data/fallbackStore';

const TYPE_COLORS = [
  'bg-indigo-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
];

export class DashboardService {
  /**
   * Retrieves aggregated dashboard data from MongoDB with Redis caching.
   */
  async getDashboardData(user: { id: string; role: Role }): Promise<DashboardData> {
    const cacheKey = `assetguard:dashboard:${user.role}`;

    // 1. Try fetching from Redis cache
    try {
      const cached = await getCache<DashboardData>(cacheKey);
      if (cached) {
        logger.info(`[DashboardService] Cache hit for key: ${cacheKey}`);
        return cached;
      }
    } catch (cacheErr: any) {
      logger.warn(`[DashboardService] Redis cache lookup failed: ${cacheErr.message}`);
    }

    // 2. Query MongoDB if database is available
    if (shouldTryDb()) {
      try {
        logger.info(`[DashboardService] Querying MongoDB for dashboard metrics (Role: ${user.role})`);

        const [totalAssets, statusCountsRaw, assetTypesRaw, recentAssets, recentWiping, recentDisposals] =
          await Promise.all([
            prisma.asset.count(),
            prisma.asset.groupBy({
              by: ['status'],
              _count: { status: true },
            }),
            prisma.asset.groupBy({
              by: ['assetType'],
              _count: { assetType: true },
              orderBy: { _count: { assetType: 'desc' } },
              take: 6,
            }),
            prisma.asset.findMany({
              orderBy: { createdAt: 'desc' },
              take: 6,
              select: {
                id: true,
                assetTag: true,
                assetType: true,
                createdAt: true,
              },
            }),
            prisma.wipingRecord.findMany({
              orderBy: { updatedAt: 'desc' },
              take: 8,
              include: {
                asset: {
                  select: { assetTag: true, assetType: true },
                },
                technician: {
                  select: { name: true },
                },
                verifiedBy: {
                  select: { name: true },
                },
              },
            }),
            prisma.disposalRecord.findMany({
              orderBy: { disposedAt: 'desc' },
              take: 6,
              include: {
                asset: {
                  select: { assetTag: true, assetType: true },
                },
                officer: {
                  select: { name: true },
                },
              },
            }),
          ]);

        // Map status counts
        const statusMap: Record<AssetStatus, number> = {
          [AssetStatus.REGISTERED]: 0,
          [AssetStatus.WIPING_PENDING]: 0,
          [AssetStatus.WIPING_IN_PROGRESS]: 0,
          [AssetStatus.WIPING_COMPLETED]: 0,
          [AssetStatus.VERIFIED]: 0,
          [AssetStatus.DISPOSED]: 0,
        };

        statusCountsRaw.forEach((item) => {
          statusMap[item.status] = item._count.status;
        });

        const lifecycle: DashboardLifecycle = {
          registered: statusMap[AssetStatus.REGISTERED],
          wipingPending: statusMap[AssetStatus.WIPING_PENDING],
          wipingInProgress: statusMap[AssetStatus.WIPING_IN_PROGRESS],
          wipingCompleted: statusMap[AssetStatus.WIPING_COMPLETED],
          verified: statusMap[AssetStatus.VERIFIED],
          disposed: statusMap[AssetStatus.DISPOSED],
        };

        const summary: DashboardSummary = {
          totalAssets,
          wipingInProgress: lifecycle.wipingInProgress,
          verified: lifecycle.verified,
          disposed: lifecycle.disposed,
        };

        // Format Asset Types distribution
        const assetTypes: DashboardAssetType[] = assetTypesRaw.map((item, index) => {
          const count = item._count.assetType;
          const percentage = totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0;
          return {
            type: item.assetType,
            count,
            percentage,
            color: TYPE_COLORS[index % TYPE_COLORS.length],
          };
        });

        // Assemble Role-Filtered Recent Activity
        const activities: DashboardRecentActivity[] = [];

        if (user.role === Role.ADMIN || user.role === Role.IT_OFFICER) {
          recentAssets.forEach((asset) => {
            activities.push({
              id: `asset-${asset.id}`,
              assetTag: asset.assetTag,
              action: 'Asset Registered',
              status: 'REGISTERED',
              timestamp: asset.createdAt,
              assetType: asset.assetType,
              userName: 'System / User',
              details: `Asset ${asset.assetTag} enrolled into inventory`,
            });
          });
        }

        if (user.role === Role.ADMIN || user.role === Role.IT_OFFICER || user.role === Role.DISPOSAL_OFFICER) {
          recentWiping.forEach((wiping) => {
            if (wiping.status === WipingStatus.IN_PROGRESS) {
              activities.push({
                id: `wiping-${wiping.id}-progress`,
                assetTag: wiping.asset.assetTag,
                action: 'Wiping Started',
                status: 'WIPING_IN_PROGRESS',
                timestamp: wiping.startedAt || wiping.updatedAt,
                assetType: wiping.asset.assetType,
                userName: wiping.technician?.name,
                details: `Sanitization initiated using ${wiping.wipingMethod}`,
              });
            } else if (wiping.status === WipingStatus.COMPLETED && wiping.verificationStatus === VerificationStatus.PENDING) {
              activities.push({
                id: `wiping-${wiping.id}-completed`,
                assetTag: wiping.asset.assetTag,
                action: 'Wiping Completed',
                status: 'WIPING_COMPLETED',
                timestamp: wiping.completedAt || wiping.updatedAt,
                assetType: wiping.asset.assetType,
                userName: wiping.technician?.name,
                details: `Erasure completed via ${wiping.wipingTool}. Awaiting verification.`,
              });
            } else if (wiping.status === WipingStatus.FAILED) {
              activities.push({
                id: `wiping-${wiping.id}-failed`,
                assetTag: wiping.asset.assetTag,
                action: 'Wiping Failed',
                status: 'FAILED',
                timestamp: wiping.updatedAt,
                assetType: wiping.asset.assetType,
                userName: wiping.technician?.name,
                details: wiping.remarks || 'Sanitization process failed',
              });
            }

            if (wiping.verificationStatus === VerificationStatus.VERIFIED) {
              activities.push({
                id: `verification-${wiping.id}-verified`,
                assetTag: wiping.asset.assetTag,
                action: 'Wiping Verified',
                status: 'VERIFIED',
                timestamp: wiping.verifiedAt || wiping.updatedAt,
                assetType: wiping.asset.assetType,
                userName: wiping.verifiedBy?.name,
                details: 'Cryptographic wiping audit passed & certified',
              });
            } else if (wiping.verificationStatus === VerificationStatus.REJECTED) {
              activities.push({
                id: `verification-${wiping.id}-rejected`,
                assetTag: wiping.asset.assetTag,
                action: 'Wiping Rejected',
                status: 'REJECTED',
                timestamp: wiping.updatedAt,
                assetType: wiping.asset.assetType,
                userName: wiping.verifiedBy?.name,
                details: wiping.rejectionReason || 'Sanitization audit failed QA check',
              });
            }
          });
        }

        if (user.role === Role.ADMIN || user.role === Role.DISPOSAL_OFFICER) {
          recentDisposals.forEach((disposal) => {
            activities.push({
              id: `disposal-${disposal.id}`,
              assetTag: disposal.asset.assetTag,
              action: 'Asset Disposed',
              status: 'DISPOSED',
              timestamp: disposal.disposedAt,
              assetType: disposal.asset.assetType,
              userName: disposal.officer?.name,
              details: `Processed via ${disposal.disposalMethod} (${disposal.vendorName || 'In-house'})`,
            });
          });
        }

        activities.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        const dashboardData: DashboardData = {
          summary,
          lifecycle,
          assetTypes,
          recentActivity: activities.slice(0, 8),
        };

        handleDbSuccess();
        setCache(cacheKey, dashboardData, config.redisDashboardTtl).catch(() => {});
        return dashboardData;
      } catch (dbError: any) {
        handleDbFailure(dbError);
      }
    }

    // 3. Resilient In-Memory Fallback Aggregation
    const totalAssets = fallbackAssets.length;
    const statusMap: Record<AssetStatus, number> = {
      [AssetStatus.REGISTERED]: 0,
      [AssetStatus.WIPING_PENDING]: 0,
      [AssetStatus.WIPING_IN_PROGRESS]: 0,
      [AssetStatus.WIPING_COMPLETED]: 0,
      [AssetStatus.VERIFIED]: 0,
      [AssetStatus.DISPOSED]: 0,
    };

    const typeCountMap: Record<string, number> = {};

    fallbackAssets.forEach((asset) => {
      statusMap[asset.status as AssetStatus] = (statusMap[asset.status as AssetStatus] || 0) + 1;
      typeCountMap[asset.assetType] = (typeCountMap[asset.assetType] || 0) + 1;
    });

    const lifecycle: DashboardLifecycle = {
      registered: statusMap[AssetStatus.REGISTERED],
      wipingPending: statusMap[AssetStatus.WIPING_PENDING],
      wipingInProgress: statusMap[AssetStatus.WIPING_IN_PROGRESS],
      wipingCompleted: statusMap[AssetStatus.WIPING_COMPLETED],
      verified: statusMap[AssetStatus.VERIFIED],
      disposed: statusMap[AssetStatus.DISPOSED],
    };

    const summary: DashboardSummary = {
      totalAssets,
      wipingInProgress: lifecycle.wipingInProgress,
      verified: lifecycle.verified,
      disposed: lifecycle.disposed,
    };

    const assetTypes: DashboardAssetType[] = Object.entries(typeCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([type, count], index) => {
        const percentage = totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0;
        return {
          type,
          count,
          percentage,
          color: TYPE_COLORS[index % TYPE_COLORS.length],
        };
      });

    const recentActivity = getFallbackRecentActivity(user.role);

    const fallbackData: DashboardData = {
      summary,
      lifecycle,
      assetTypes,
      recentActivity,
    };

    setCache(cacheKey, fallbackData, config.redisDashboardTtl).catch(() => {});
    return fallbackData;
  }
}

export const dashboardService = new DashboardService();
