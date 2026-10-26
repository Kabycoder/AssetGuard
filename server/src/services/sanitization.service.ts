import {
  AssetStatus,
  Prisma,
  VerificationStatus,
  WipingStatus,
} from '@prisma/client';
import { prisma, invalidateDashboardCache } from '../config';
import {
  CompleteWipingDto,
  FailWipingDto,
  PaginatedSanitizationResponse,
  SanitizationDetailResponse,
  SanitizationQueryParams,
  StartWipingDto,
} from '../types/sanitization.types';

import {
  fallbackAssets,
  fallbackWipingRecords,
  FALLBACK_USERS,
  shouldTryDb,
  handleDbSuccess,
  handleDbFailure,
  saveFallbackStore,
} from '../data/fallbackStore';
import { generateObjectId } from '../utils/objectId';

const FALLBACK_DEFAULT_TECHNICIAN = FALLBACK_USERS.IT_OFFICER;

export class SanitizationService {

  /**
   * Retrieves paginated queue of assets requiring or undergoing sanitization.
   * Includes statuses: REGISTERED, WIPING_PENDING, WIPING_IN_PROGRESS, WIPING_COMPLETED.
   */
  async getSanitizationQueue(
    query: SanitizationQueryParams
  ): Promise<PaginatedSanitizationResponse> {
    const page = Math.max(1, parseInt(String(query.page || '1'), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(query.limit || '10'), 10)));
    const skip = (page - 1) * limit;

    const { search, status, wipingStatus, assetType, department } = query;

    // Allowed statuses for the sanitization workflow queue
    const sanitizationStatuses: AssetStatus[] = [
      AssetStatus.REGISTERED,
      AssetStatus.WIPING_PENDING,
      AssetStatus.WIPING_IN_PROGRESS,
      AssetStatus.WIPING_COMPLETED,
    ];

    if (shouldTryDb()) {
      try {
        const where: Prisma.AssetWhereInput = {
          status: status
            ? (status as AssetStatus)
            : { in: sanitizationStatuses },
        };

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

        if (wipingStatus) {
          where.wipingRecords = {
            some: {
              status: wipingStatus as WipingStatus,
            },
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
    let filtered = fallbackAssets.filter((a) =>
      sanitizationStatuses.includes(a.status)
    );

    if (status) {
      filtered = filtered.filter((a) => a.status === status);
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
    if (wipingStatus) {
      finalFiltered = finalFiltered.filter(
        (a) => a.activeWipingRecord && a.activeWipingRecord.status === wipingStatus
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
   * Retrieves complete wiping history for a specific asset.
   * Excludes passwordHash and includes full technician metadata.
   */
  async getAssetSanitizationHistory(
    assetId: string
  ): Promise<SanitizationDetailResponse | null> {
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
   * Starts wiping on an eligible asset (REGISTERED or WIPING_PENDING).
   * Atomically creates/updates WipingRecord (IN_PROGRESS) and updates Asset.status = WIPING_IN_PROGRESS.
   */
  async startWiping(
    assetId: string,
    technicianId: string,
    data: StartWipingDto
  ): Promise<any> {
    if (shouldTryDb()) {
      try {
        const asset = await prisma.asset.findUnique({
          where: { id: assetId },
          include: {
            wipingRecords: {
              where: { status: WipingStatus.IN_PROGRESS },
            },
          },
        });

        if (!asset) {
          throw new Error('ASSET_NOT_FOUND');
        }

        // Prevent duplicate active wipe operations
        if (
          asset.status === AssetStatus.WIPING_IN_PROGRESS ||
          asset.wipingRecords.length > 0
        ) {
          throw new Error('WIPING_ALREADY_IN_PROGRESS');
        }

        if (asset.status === AssetStatus.DISPOSED) {
          throw new Error('ASSET_ALREADY_DISPOSED');
        }

        // Atomic Transaction
        const [updatedAsset, wipingRecord] = await prisma.$transaction([
          prisma.asset.update({
            where: { id: assetId },
            data: {
              status: AssetStatus.WIPING_IN_PROGRESS,
            },
          }),
          prisma.wipingRecord.create({
            data: {
              assetId,
              technicianId,
              wipingMethod: data.wipingMethod?.trim() || 'NIST SP 800-88 Rev 1 (Purge)',
              wipingTool: data.wipingTool?.trim() || 'Blancco Drive Eraser',
              status: WipingStatus.IN_PROGRESS,
              verificationStatus: VerificationStatus.PENDING,
              startedAt: new Date(),
              remarks: data.remarks?.trim() || 'Wiping operation started.',
            },
            include: {
              technician: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          }),
        ]);

        handleDbSuccess();
        invalidateDashboardCache().catch(() => {});
        return {
          asset: updatedAsset,
          wipingRecord,
        };
      } catch (dbError: any) {
        if (
          dbError.message === 'ASSET_NOT_FOUND' ||
          dbError.message === 'WIPING_ALREADY_IN_PROGRESS' ||
          dbError.message === 'ASSET_ALREADY_DISPOSED'
        ) {
          throw dbError;
        }
        handleDbFailure(dbError);
      }
    }

    // In-memory fallback
    const assetIndex = fallbackAssets.findIndex((a) => a.id === assetId);
    if (assetIndex === -1) {
      throw new Error('ASSET_NOT_FOUND');
    }

    const asset = fallbackAssets[assetIndex];
    if (asset.status === AssetStatus.WIPING_IN_PROGRESS) {
      throw new Error('WIPING_ALREADY_IN_PROGRESS');
    }

    if (asset.status === AssetStatus.DISPOSED) {
      throw new Error('ASSET_ALREADY_DISPOSED');
    }

    const newRecord = {
      id: generateObjectId(),
      assetId,
      technicianId,
      technician: FALLBACK_DEFAULT_TECHNICIAN,
      wipingMethod: data.wipingMethod?.trim() || 'NIST SP 800-88 Rev 1 (Purge)',
      wipingTool: data.wipingTool?.trim() || 'Blancco Drive Eraser',
      status: WipingStatus.IN_PROGRESS,
      verificationStatus: VerificationStatus.PENDING,
      startedAt: new Date(),
      completedAt: null,
      verifiedAt: null,
      remarks: data.remarks?.trim() || 'Wiping operation started.',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    fallbackWipingRecords.unshift(newRecord);
    asset.status = AssetStatus.WIPING_IN_PROGRESS;
    asset.updatedAt = new Date();
    saveFallbackStore();
    invalidateDashboardCache().catch(() => {});

    return {
      asset,
      wipingRecord: newRecord,
    };
  }

  /**
   * Completes data wiping operation.
   * Atomically updates active WipingRecord (COMPLETED, verificationStatus: PENDING) and Asset.status = WIPING_COMPLETED.
   * Note: Asset is NOT verified yet (Phase 6 Admin verification workflow).
   */
  async completeWiping(
    assetId: string,
    technicianId: string,
    data: CompleteWipingDto
  ): Promise<any> {
    if (!data.wipingMethod || !data.wipingMethod.trim()) {
      throw new Error('WIPING_METHOD_REQUIRED');
    }

    if (!data.wipingTool || !data.wipingTool.trim()) {
      throw new Error('WIPING_TOOL_REQUIRED');
    }

    if (shouldTryDb()) {
      try {
        const asset = await prisma.asset.findUnique({
          where: { id: assetId },
          include: {
            wipingRecords: {
              where: { status: WipingStatus.IN_PROGRESS },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!asset) {
          throw new Error('ASSET_NOT_FOUND');
        }

        if (asset.status !== AssetStatus.WIPING_IN_PROGRESS) {
          throw new Error('INVALID_WORKFLOW_STATE');
        }

        let activeRecord = asset.wipingRecords[0];

        // Atomic Transaction
        const result = await prisma.$transaction(async (tx) => {
          let updatedRecord;
          if (activeRecord) {
            updatedRecord = await tx.wipingRecord.update({
              where: { id: activeRecord.id },
              data: {
                wipingMethod: data.wipingMethod.trim(),
                wipingTool: data.wipingTool.trim(),
                status: WipingStatus.COMPLETED,
                verificationStatus: VerificationStatus.PENDING,
                completedAt: new Date(),
                remarks: data.remarks?.trim() || activeRecord.remarks,
                technicianId,
              },
              include: {
                technician: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            });
          } else {
            // Create completed record if active one wasn't created yet
            updatedRecord = await tx.wipingRecord.create({
              data: {
                assetId,
                technicianId,
                wipingMethod: data.wipingMethod.trim(),
                wipingTool: data.wipingTool.trim(),
                status: WipingStatus.COMPLETED,
                verificationStatus: VerificationStatus.PENDING,
                startedAt: new Date(Date.now() - 3600000),
                completedAt: new Date(),
                remarks: data.remarks?.trim() || 'Wiping completed successfully.',
              },
              include: {
                technician: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            });
          }

          const updatedAsset = await tx.asset.update({
            where: { id: assetId },
            data: {
              status: AssetStatus.WIPING_COMPLETED,
            },
          });

          return { asset: updatedAsset, wipingRecord: updatedRecord };
        });

        handleDbSuccess();
        invalidateDashboardCache().catch(() => {});
        return result;
      } catch (dbError: any) {
        if (
          dbError.message === 'ASSET_NOT_FOUND' ||
          dbError.message === 'INVALID_WORKFLOW_STATE' ||
          dbError.message === 'WIPING_METHOD_REQUIRED' ||
          dbError.message === 'WIPING_TOOL_REQUIRED'
        ) {
          throw dbError;
        }
        handleDbFailure(dbError);
      }
    }

    // In-memory fallback
    const asset = fallbackAssets.find((a) => a.id === assetId);
    if (!asset) throw new Error('ASSET_NOT_FOUND');

    if (asset.status !== AssetStatus.WIPING_IN_PROGRESS) {
      throw new Error('INVALID_WORKFLOW_STATE');
    }

    const activeRecordIndex = fallbackWipingRecords.findIndex(
      (w) => w.assetId === assetId && w.status === WipingStatus.IN_PROGRESS
    );

    let updatedRecord;
    if (activeRecordIndex !== -1) {
      const active = fallbackWipingRecords[activeRecordIndex];
      active.wipingMethod = data.wipingMethod.trim();
      active.wipingTool = data.wipingTool.trim();
      active.status = WipingStatus.COMPLETED;
      active.verificationStatus = VerificationStatus.PENDING;
      active.completedAt = new Date();
      if (data.remarks) active.remarks = data.remarks.trim();
      active.updatedAt = new Date();
      updatedRecord = active;
    } else {
      updatedRecord = {
        id: generateObjectId(),
        assetId,
        technicianId,
        technician: FALLBACK_DEFAULT_TECHNICIAN,
        wipingMethod: data.wipingMethod.trim(),
        wipingTool: data.wipingTool.trim(),
        status: WipingStatus.COMPLETED,
        verificationStatus: VerificationStatus.PENDING,
        startedAt: new Date(Date.now() - 3600000),
        completedAt: new Date(),
        verifiedAt: null,
        remarks: data.remarks?.trim() || 'Wiping completed successfully.',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      fallbackWipingRecords.unshift(updatedRecord);
    }

    asset.status = AssetStatus.WIPING_COMPLETED;
    asset.updatedAt = new Date();
    saveFallbackStore();
    invalidateDashboardCache().catch(() => {});

    return { asset, wipingRecord: updatedRecord };
  }

  /**
   * Marks active wiping as failed.
   * Atomically updates active WipingRecord (FAILED with reason/remarks preserved) and resets Asset.status = WIPING_PENDING.
   * Preserves failed record in history for compliance audits.
   */
  async failWiping(
    assetId: string,
    technicianId: string,
    data: FailWipingDto
  ): Promise<any> {
    const failureReason = data.reason?.trim() || 'Unspecified hardware or process error';
    const failureRemarks = data.remarks?.trim()
      ? `[FAILURE REASON: ${failureReason}] ${data.remarks.trim()}`
      : `[FAILURE REASON: ${failureReason}]`;

    if (shouldTryDb()) {
      try {
        const asset = await prisma.asset.findUnique({
          where: { id: assetId },
          include: {
            wipingRecords: {
              where: { status: WipingStatus.IN_PROGRESS },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!asset) {
          throw new Error('ASSET_NOT_FOUND');
        }

        if (asset.status !== AssetStatus.WIPING_IN_PROGRESS) {
          throw new Error('INVALID_WORKFLOW_STATE');
        }

        const activeRecord = asset.wipingRecords[0];

        // Atomic Transaction
        const result = await prisma.$transaction(async (tx) => {
          let updatedRecord;
          if (activeRecord) {
            updatedRecord = await tx.wipingRecord.update({
              where: { id: activeRecord.id },
              data: {
                status: WipingStatus.FAILED,
                remarks: failureRemarks,
                completedAt: new Date(),
                technicianId,
              },
              include: {
                technician: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            });
          } else {
            updatedRecord = await tx.wipingRecord.create({
              data: {
                assetId,
                technicianId,
                wipingMethod: 'Attempted Sanitization',
                wipingTool: 'Standard Diagnostic Tool',
                status: WipingStatus.FAILED,
                verificationStatus: VerificationStatus.PENDING,
                startedAt: new Date(Date.now() - 1800000),
                completedAt: new Date(),
                remarks: failureRemarks,
              },
              include: {
                technician: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            });
          }

          // Return asset to WIPING_PENDING so it can be re-sanitized
          const updatedAsset = await tx.asset.update({
            where: { id: assetId },
            data: {
              status: AssetStatus.WIPING_PENDING,
            },
          });

          return { asset: updatedAsset, wipingRecord: updatedRecord };
        });

        handleDbSuccess();
        invalidateDashboardCache().catch(() => {});
        return result;
      } catch (dbError: any) {
        if (
          dbError.message === 'ASSET_NOT_FOUND' ||
          dbError.message === 'INVALID_WORKFLOW_STATE'
        ) {
          throw dbError;
        }
        handleDbFailure(dbError);
      }
    }

    // In-memory fallback
    const asset = fallbackAssets.find((a) => a.id === assetId);
    if (!asset) throw new Error('ASSET_NOT_FOUND');

    if (asset.status !== AssetStatus.WIPING_IN_PROGRESS) {
      throw new Error('INVALID_WORKFLOW_STATE');
    }

    const activeRecordIndex = fallbackWipingRecords.findIndex(
      (w) => w.assetId === assetId && w.status === WipingStatus.IN_PROGRESS
    );

    let updatedRecord;
    if (activeRecordIndex !== -1) {
      const active = fallbackWipingRecords[activeRecordIndex];
      active.status = WipingStatus.FAILED;
      active.remarks = failureRemarks;
      active.completedAt = new Date();
      active.updatedAt = new Date();
      updatedRecord = active;
    } else {
      updatedRecord = {
        id: generateObjectId(),
        assetId,
        technicianId,
        technician: FALLBACK_DEFAULT_TECHNICIAN,
        wipingMethod: 'Attempted Sanitization',
        wipingTool: 'Standard Diagnostic Tool',
        status: WipingStatus.FAILED,
        verificationStatus: VerificationStatus.PENDING,
        startedAt: new Date(Date.now() - 1800000),
        completedAt: new Date(),
        verifiedAt: null,
        remarks: failureRemarks,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      fallbackWipingRecords.unshift(updatedRecord);
    }

    asset.status = AssetStatus.WIPING_PENDING;
    asset.updatedAt = new Date();
    saveFallbackStore();
    invalidateDashboardCache().catch(() => {});

    return { asset, wipingRecord: updatedRecord };
  }
}

export const sanitizationService = new SanitizationService();
