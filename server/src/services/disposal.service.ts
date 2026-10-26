import { AssetStatus, DisposalMethod, Prisma } from '@prisma/client';
import { prisma, invalidateDashboardCache } from '../config';
import {
  CreateDisposalDto,
  DisposalQueryParams,
  PaginatedDisposalResponse,
} from '../types/disposal.types';
import {
  fallbackAssets,
  fallbackDisposalRecords,
  fallbackWipingRecords,
  FALLBACK_USERS,
  shouldTryDb,
  handleDbSuccess,
  handleDbFailure,
  saveFallbackStore,
} from '../data/fallbackStore';
import { generateObjectId } from '../utils/objectId';

export class DisposalService {
  /**
   * Retrieves paginated disposal history and queue of VERIFIED assets awaiting disposition.
   */
  async getDisposalQueue(params?: DisposalQueryParams): Promise<PaginatedDisposalResponse> {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params?.limit) || 10));
    const skip = (page - 1) * limit;

    if (shouldTryDb()) {
      try {
        const whereClause: Prisma.DisposalRecordWhereInput = {};

        if (params?.disposalMethod) {
          whereClause.disposalMethod = params.disposalMethod as DisposalMethod;
        }

        if (params?.vendorName) {
          whereClause.vendorName = { contains: params.vendorName, mode: 'insensitive' };
        }

        if (params?.search) {
          const s = params.search.trim();
          whereClause.OR = [
            { certificateNumber: { contains: s, mode: 'insensitive' } },
            { vendorName: { contains: s, mode: 'insensitive' } },
            { asset: { assetTag: { contains: s, mode: 'insensitive' } } },
            { asset: { serialNumber: { contains: s, mode: 'insensitive' } } },
          ];
        }

        const [records, total, verifiedQueue] = await Promise.all([
          prisma.disposalRecord.findMany({
            where: whereClause,
            include: {
              asset: {
                select: {
                  id: true,
                  assetTag: true,
                  serialNumber: true,
                  assetType: true,
                  brand: true,
                  model: true,
                  department: true,
                  status: true,
                },
              },
              officer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
            orderBy: { disposedAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.disposalRecord.count({ where: whereClause }),
          prisma.asset.findMany({
            where: { status: AssetStatus.VERIFIED },
            orderBy: { updatedAt: 'desc' },
            take: 20,
          }),
        ]);

        handleDbSuccess();
        return {
          records: records as any,
          verifiedQueue,
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        };
      } catch (dbError: any) {
        handleDbFailure(dbError);
      }
    }

    // Fallback in-memory
    const mappedFallback = fallbackDisposalRecords.map((r) => {
      const asset = fallbackAssets.find((a) => a.id === r.assetId);
      return {
        ...r,
        asset: r.asset || (asset ? {
          id: asset.id,
          assetTag: asset.assetTag,
          serialNumber: asset.serialNumber,
          assetType: asset.assetType,
          brand: asset.brand,
          model: asset.model,
          department: asset.department,
          status: asset.status,
        } : null),
      };
    });

    let filtered = [...mappedFallback];
    if (params?.disposalMethod) {
      filtered = filtered.filter((r) => r.disposalMethod === params.disposalMethod);
    }
    if (params?.vendorName) {
      const v = params.vendorName.toLowerCase();
      filtered = filtered.filter((r) => r.vendorName?.toLowerCase().includes(v));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.certificateNumber?.toLowerCase().includes(q) ||
          r.vendorName?.toLowerCase().includes(q) ||
          r.asset?.assetTag?.toLowerCase().includes(q) ||
          r.asset?.serialNumber?.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const records = filtered.slice(skip, skip + limit);
    const verifiedQueue = fallbackAssets.filter((a) => a.status === AssetStatus.VERIFIED);

    return {
      records: records as any,
      verifiedQueue,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves full details and disposition log for a specific asset.
   */
  async getDisposalByAssetId(assetId: string): Promise<any> {
    if (shouldTryDb()) {
      try {
        const asset = await prisma.asset.findUnique({
          where: { id: assetId },
          include: {
            disposalRecords: {
              include: {
                officer: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
              orderBy: { disposedAt: 'desc' },
            },
            wipingRecords: {
              include: {
                technician: { select: { id: true, name: true, email: true, role: true } },
                verifiedBy: { select: { id: true, name: true, email: true, role: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!asset) {
          throw new Error('ASSET_NOT_FOUND');
        }

        handleDbSuccess();
        return asset;
      } catch (dbError: any) {
        if (dbError.message === 'ASSET_NOT_FOUND') throw dbError;
        handleDbFailure(dbError);
      }
    }

    // Fallback
    const asset = fallbackAssets.find((a) => a.id === assetId);
    if (!asset) {
      throw new Error('ASSET_NOT_FOUND');
    }

    const record = fallbackDisposalRecords.find((r) => r.assetId === assetId);
    const wipingRecords = fallbackWipingRecords.filter((w) => w.assetId === assetId);

    return {
      ...asset,
      disposalRecords: record ? [record] : [],
      wipingRecords,
    };
  }

  /**
   * Records physical disposition / recycling batch for an asset.
   * Requires Asset to be in VERIFIED status.
   * Transitions Asset.status to DISPOSED.
   */
  async recordDisposal(
    assetId: string,
    officerId: string,
    data: CreateDisposalDto
  ): Promise<any> {
    if (!data.disposalMethod) {
      throw new Error('DISPOSAL_METHOD_REQUIRED');
    }

    const certificateNumber =
      data.certificateNumber?.trim() ||
      `COD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (shouldTryDb()) {
      try {
        const asset = await prisma.asset.findUnique({
          where: { id: assetId },
        });

        if (!asset) {
          throw new Error('ASSET_NOT_FOUND');
        }

        if (asset.status === AssetStatus.DISPOSED) {
          throw new Error('ASSET_ALREADY_DISPOSED');
        }

        if (asset.status !== AssetStatus.VERIFIED) {
          throw new Error('ASSET_NOT_VERIFIED');
        }

        // Atomic Transaction: Create DisposalRecord and set Asset.status = DISPOSED
        const [updatedAsset, disposalRecord] = await prisma.$transaction([
          prisma.asset.update({
            where: { id: assetId },
            data: {
              status: AssetStatus.DISPOSED,
            },
          }),
          prisma.disposalRecord.create({
            data: {
              assetId,
              officerId,
              disposalMethod: data.disposalMethod,
              vendorName: data.vendorName?.trim() || 'Internal Operations',
              certificateNumber,
              remarks: data.remarks?.trim() || 'Disposition process completed in compliance with R2/e-Stewards standard.',
              disposedAt: new Date(),
            },
            include: {
              officer: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          }),
        ]);

        handleDbSuccess();
        invalidateDashboardCache().catch(() => {});
        return {
          asset: updatedAsset,
          disposalRecord,
        };
      } catch (dbError: any) {
        if (
          dbError.message === 'ASSET_NOT_FOUND' ||
          dbError.message === 'ASSET_ALREADY_DISPOSED' ||
          dbError.message === 'ASSET_NOT_VERIFIED' ||
          dbError.message === 'DISPOSAL_METHOD_REQUIRED'
        ) {
          throw dbError;
        }
        handleDbFailure(dbError);
      }
    }

    // Fallback in-memory
    const asset = fallbackAssets.find((a) => a.id === assetId);

    if (!asset) {
      throw new Error('ASSET_NOT_FOUND');
    }

    if (asset.status === AssetStatus.DISPOSED) {
      throw new Error('ASSET_ALREADY_DISPOSED');
    }

    if (asset.status !== AssetStatus.VERIFIED) {
      throw new Error('ASSET_NOT_VERIFIED');
    }

    asset.status = AssetStatus.DISPOSED;
    asset.updatedAt = new Date();

    const newRecord = {
      id: generateObjectId(),
      assetId,
      officerId,
      officer: FALLBACK_USERS.DISPOSAL_OFFICER,
      disposalMethod: data.disposalMethod,
      vendorName: data.vendorName?.trim() || 'Internal Operations',
      certificateNumber,
      remarks: data.remarks?.trim() || 'Disposition process completed in compliance with R2/e-Stewards standard.',
      disposedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      asset: {
        id: asset.id,
        assetTag: asset.assetTag,
        serialNumber: asset.serialNumber,
        assetType: asset.assetType,
        brand: asset.brand,
        model: asset.model,
        department: asset.department,
        status: asset.status,
      },
    };

    fallbackDisposalRecords.unshift(newRecord);
    saveFallbackStore();
    invalidateDashboardCache().catch(() => {});

    return {
      asset: { ...asset },
      disposalRecord: newRecord,
    };
  }
}

export const disposalService = new DisposalService();
