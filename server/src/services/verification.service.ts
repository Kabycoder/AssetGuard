import {
  AssetStatus,
  Prisma,
  VerificationStatus,
  WipingStatus,
} from '@prisma/client';
import { prisma, invalidateDashboardCache } from '../config';
import {
  PaginatedVerificationResponse,
  RejectVerificationDto,
  VerificationDetailResponse,
  VerificationQueryParams,
  VerifyAssetDto,
} from '../types/verification.types';

import {
  fallbackAssets,
  fallbackWipingRecords,
  FALLBACK_USERS,
  shouldTryDb,
  handleDbSuccess,
  handleDbFailure,
  saveFallbackStore,
} from '../data/fallbackStore';

const FALLBACK_DEFAULT_ADMIN = FALLBACK_USERS.ADMIN;

export class VerificationService {

  /**
   * Retrieves paginated queue of assets awaiting verification (WIPING_COMPLETED) or filtered by status.
   */
  async getVerificationQueue(
    query: VerificationQueryParams
  ): Promise<PaginatedVerificationResponse> {
    const page = Math.max(1, parseInt(String(query.page || '1'), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(query.limit || '10'), 10)));
    const skip = (page - 1) * limit;

    const { search, status, verificationStatus, assetType, department } = query;

    if (shouldTryDb()) {
      try {
        const where: Prisma.AssetWhereInput = {};

        if (status) {
          where.status = status as AssetStatus;
        } else if (!verificationStatus) {
          // Default view: assets ready for verification or recently verified
          where.status = {
            in: [AssetStatus.WIPING_COMPLETED, AssetStatus.VERIFIED],
          };
        }

        if (verificationStatus) {
          where.wipingRecords = {
            some: {
              verificationStatus: verificationStatus as VerificationStatus,
            },
          };
        }

        if (assetType) {
          where.assetType = {
            equals: assetType,
            mode: 'insensitive',
          };
        }

        if (department) {
          where.department = {
            equals: department,
            mode: 'insensitive',
          };
        }

        if (search && search.trim()) {
          const searchTerm = search.trim();
          where.OR = [
            { assetTag: { contains: searchTerm, mode: 'insensitive' } },
            { serialNumber: { contains: searchTerm, mode: 'insensitive' } },
            { brand: { contains: searchTerm, mode: 'insensitive' } },
            { model: { contains: searchTerm, mode: 'insensitive' } },
            { assetType: { contains: searchTerm, mode: 'insensitive' } },
            { department: { contains: searchTerm, mode: 'insensitive' } },
          ];
        }

        const [assets, total] = await Promise.all([
          prisma.asset.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
            include: {
              wipingRecords: {
                orderBy: { createdAt: 'desc' },
                include: {
                  technician: {
                    select: { id: true, name: true, email: true, role: true },
                  },
                  verifiedBy: {
                    select: { id: true, name: true, email: true, role: true },
                  },
                },
              },
            },
          }),
          prisma.asset.count({ where }),
        ]);

        const mappedAssets = assets.map((a) => {
          const activeWiping = a.wipingRecords.length > 0 ? a.wipingRecords[0] : null;
          return {
            ...a,
            wipingRecords: a.wipingRecords as any,
            activeWipingRecord: activeWiping as any,
          };
        });

        handleDbSuccess();
        return {
          assets: mappedAssets,
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        };
      } catch (dbError) {
        handleDbFailure(dbError);
      }
    }

    // In-memory fallback
    let filtered = [...fallbackAssets];

    if (status) {
      filtered = filtered.filter((a) => a.status === status);
    } else if (!verificationStatus) {
      filtered = filtered.filter((a) =>
        [AssetStatus.WIPING_COMPLETED, AssetStatus.VERIFIED].includes(a.status)
      );
    }

    if (assetType) {
      filtered = filtered.filter(
        (a) => a.assetType.toLowerCase() === assetType.toLowerCase()
      );
    }

    if (department) {
      filtered = filtered.filter(
        (a) => a.department.toLowerCase() === department.toLowerCase()
      );
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.assetTag.toLowerCase().includes(term) ||
          a.serialNumber.toLowerCase().includes(term) ||
          a.brand.toLowerCase().includes(term) ||
          a.model.toLowerCase().includes(term) ||
          a.assetType.toLowerCase().includes(term) ||
          a.department.toLowerCase().includes(term)
      );
    }

    const assetsWithRecords = filtered.map((asset) => {
      const records = fallbackWipingRecords
        .filter((w) => w.assetId === asset.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        ...asset,
        wipingRecords: records,
        activeWipingRecord: records.length > 0 ? records[0] : null,
      };
    });

    let finalFiltered = assetsWithRecords;
    if (verificationStatus) {
      finalFiltered = finalFiltered.filter(
        (a) =>
          a.activeWipingRecord &&
          a.activeWipingRecord.verificationStatus === verificationStatus
      );
    }

    const total = finalFiltered.length;
    const paginated = finalFiltered.slice(skip, skip + limit);

    return {
      assets: paginated,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves single asset details with complete verification audit history.
   */
  async getAssetVerificationDetail(
    assetId: string
  ): Promise<VerificationDetailResponse | null> {
    if (shouldTryDb()) {
      try {
        const asset = await prisma.asset.findUnique({
          where: { id: assetId },
          include: {
            wipingRecords: {
              orderBy: { createdAt: 'desc' },
              include: {
                technician: {
                  select: { id: true, name: true, email: true, role: true },
                },
                verifiedBy: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
        });

        if (asset) {
          handleDbSuccess();
          return {
            asset: asset as any,
            wipingRecords: asset.wipingRecords as any,
          };
        }
      } catch (dbError) {
        handleDbFailure(dbError);
      }
    }

    // Fallback
    const asset = fallbackAssets.find((a) => a.id === assetId);
    if (!asset) return null;

    const records = fallbackWipingRecords
      .filter((w) => w.assetId === assetId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      asset: {
        ...asset,
        wipingRecords: records,
        activeWipingRecord: records[0] || null,
      },
      wipingRecords: records,
    };
  }

  /**
   * Admin approves/verifies a completed data wiping operation.
   * Atomically sets WipingRecord.verificationStatus = VERIFIED and Asset.status = VERIFIED.
   */
  async verifyAsset(
    assetId: string,
    adminId: string,
    data: VerifyAssetDto
  ): Promise<any> {
    if (shouldTryDb()) {
      try {
        const asset = await prisma.asset.findUnique({
          where: { id: assetId },
          include: {
            wipingRecords: {
              where: { status: WipingStatus.COMPLETED },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!asset) {
          throw new Error('ASSET_NOT_FOUND');
        }

        if (asset.status !== AssetStatus.WIPING_COMPLETED) {
          throw new Error('INVALID_WORKFLOW_STATE');
        }

        const latestRecord = asset.wipingRecords[0];
        if (!latestRecord) {
          throw new Error('NO_COMPLETED_WIPING_RECORD');
        }

        const auditRemarks = data.remarks?.trim()
          ? `${latestRecord.remarks || ''} [ADMIN AUDIT: ${data.remarks.trim()}]`.trim()
          : latestRecord.remarks;

        // Atomic Transaction
        const [updatedAsset, updatedRecord] = await prisma.$transaction([
          prisma.asset.update({
            where: { id: assetId },
            data: {
              status: AssetStatus.VERIFIED,
            },
          }),
          prisma.wipingRecord.update({
            where: { id: latestRecord.id },
            data: {
              verificationStatus: VerificationStatus.VERIFIED,
              verifiedAt: new Date(),
              verifiedById: adminId,
              remarks: auditRemarks,
            },
            include: {
              technician: {
                select: { id: true, name: true, email: true, role: true },
              },
              verifiedBy: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          }),
        ]);

        handleDbSuccess();
        invalidateDashboardCache().catch(() => {});
        return { asset: updatedAsset, wipingRecord: updatedRecord };
      } catch (dbError: any) {
        if (
          dbError.message === 'ASSET_NOT_FOUND' ||
          dbError.message === 'INVALID_WORKFLOW_STATE' ||
          dbError.message === 'NO_COMPLETED_WIPING_RECORD'
        ) {
          throw dbError;
        }
        handleDbFailure(dbError);
      }
    }

    // In-memory fallback
    const asset = fallbackAssets.find((a) => a.id === assetId);
    if (!asset) throw new Error('ASSET_NOT_FOUND');

    if (asset.status !== AssetStatus.WIPING_COMPLETED) {
      throw new Error('INVALID_WORKFLOW_STATE');
    }

    const latestRecord = fallbackWipingRecords.find(
      (w) => w.assetId === assetId && w.status === WipingStatus.COMPLETED
    );

    if (!latestRecord) throw new Error('NO_COMPLETED_WIPING_RECORD');

    latestRecord.verificationStatus = VerificationStatus.VERIFIED;
    latestRecord.verifiedAt = new Date();
    latestRecord.verifiedById = adminId;
    latestRecord.verifiedBy = FALLBACK_DEFAULT_ADMIN;
    if (data.remarks) {
      latestRecord.remarks = `${latestRecord.remarks || ''} [ADMIN AUDIT: ${data.remarks.trim()}]`.trim();
    }
    latestRecord.updatedAt = new Date();

    asset.status = AssetStatus.VERIFIED;
    asset.updatedAt = new Date();
    saveFallbackStore();
    invalidateDashboardCache().catch(() => {});

    return { asset, wipingRecord: latestRecord };
  }

  /**
   * Admin rejects a completed data wiping operation.
   * Atomically sets WipingRecord.verificationStatus = REJECTED, stores rejectionReason, and resets Asset.status = WIPING_PENDING for re-wiping.
   */
  async rejectAsset(
    assetId: string,
    adminId: string,
    data: RejectVerificationDto
  ): Promise<any> {
    if (!data.rejectionReason || !data.rejectionReason.trim()) {
      throw new Error('REJECTION_REASON_REQUIRED');
    }

    if (shouldTryDb()) {
      try {
        const asset = await prisma.asset.findUnique({
          where: { id: assetId },
          include: {
            wipingRecords: {
              where: { status: WipingStatus.COMPLETED },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!asset) {
          throw new Error('ASSET_NOT_FOUND');
        }

        if (asset.status !== AssetStatus.WIPING_COMPLETED) {
          throw new Error('INVALID_WORKFLOW_STATE');
        }

        const latestRecord = asset.wipingRecords[0];
        if (!latestRecord) {
          throw new Error('NO_COMPLETED_WIPING_RECORD');
        }

        const auditRemarks = data.remarks?.trim()
          ? `${latestRecord.remarks || ''} [REJECTION NOTES: ${data.remarks.trim()}]`.trim()
          : latestRecord.remarks;

        // Atomic Transaction: update record as REJECTED and reset asset to WIPING_PENDING
        const [updatedAsset, updatedRecord] = await prisma.$transaction([
          prisma.asset.update({
            where: { id: assetId },
            data: {
              status: AssetStatus.WIPING_PENDING,
            },
          }),
          prisma.wipingRecord.update({
            where: { id: latestRecord.id },
            data: {
              verificationStatus: VerificationStatus.REJECTED,
              verifiedAt: new Date(),
              verifiedById: adminId,
              rejectionReason: data.rejectionReason.trim(),
              remarks: auditRemarks,
            },
            include: {
              technician: {
                select: { id: true, name: true, email: true, role: true },
              },
              verifiedBy: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          }),
        ]);

        handleDbSuccess();
        invalidateDashboardCache().catch(() => {});
        return { asset: updatedAsset, wipingRecord: updatedRecord };
      } catch (dbError: any) {
        if (
          dbError.message === 'ASSET_NOT_FOUND' ||
          dbError.message === 'INVALID_WORKFLOW_STATE' ||
          dbError.message === 'NO_COMPLETED_WIPING_RECORD' ||
          dbError.message === 'REJECTION_REASON_REQUIRED'
        ) {
          throw dbError;
        }
        handleDbFailure(dbError);
      }
    }

    // In-memory fallback
    const asset = fallbackAssets.find((a) => a.id === assetId);
    if (!asset) throw new Error('ASSET_NOT_FOUND');

    if (asset.status !== AssetStatus.WIPING_COMPLETED) {
      throw new Error('INVALID_WORKFLOW_STATE');
    }

    const latestRecord = fallbackWipingRecords.find(
      (w) => w.assetId === assetId && w.status === WipingStatus.COMPLETED
    );

    if (!latestRecord) throw new Error('NO_COMPLETED_WIPING_RECORD');

    latestRecord.verificationStatus = VerificationStatus.REJECTED;
    latestRecord.verifiedAt = new Date();
    latestRecord.verifiedById = adminId;
    latestRecord.verifiedBy = FALLBACK_DEFAULT_ADMIN;
    latestRecord.rejectionReason = data.rejectionReason.trim();
    if (data.remarks) {
      latestRecord.remarks = `${latestRecord.remarks || ''} [REJECTION NOTES: ${data.remarks.trim()}]`.trim();
    }
    latestRecord.updatedAt = new Date();

    asset.status = AssetStatus.WIPING_PENDING;
    asset.updatedAt = new Date();
    saveFallbackStore();
    invalidateDashboardCache().catch(() => {});

    return { asset, wipingRecord: latestRecord };
  }
}

export const verificationService = new VerificationService();
