import { AssetStatus, Prisma } from '@prisma/client';
import { prisma, invalidateDashboardCache } from '../config';
import {
  CreateAssetDto,
  UpdateAssetDto,
  AssetQueryParams,
  PaginatedAssetResponse,
} from '../types/asset.types';
import {
  fallbackAssets,
  shouldTryDb,
  handleDbSuccess,
  handleDbFailure,
  getPopulatedAsset,
  hasAssetWorkflowHistory,
  saveFallbackStore,
  fallbackWipingRecords,
  fallbackDisposalRecords,
} from '../data/fallbackStore';
import { generateObjectId } from '../utils/objectId';

export class AssetService {
  /**
   * Retrieves paginated, filtered, and searchable list of assets.
   */
  async getAssets(query: AssetQueryParams): Promise<PaginatedAssetResponse> {
    const page = Math.max(1, parseInt(String(query.page || '1'), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(query.limit || '10'), 10)));
    const skip = (page - 1) * limit;

    const { search, status, assetType, department } = query;

    if (shouldTryDb()) {
      try {
        const where: Prisma.AssetWhereInput = {};

        if (status) {
          where.status = status;
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
            orderBy: { createdAt: 'desc' },
            include: {
              wipingRecords: {
                select: {
                  id: true,
                  status: true,
                  verificationStatus: true,
                  wipingMethod: true,
                },
              },
              disposalRecords: {
                select: {
                  id: true,
                  disposalMethod: true,
                  certificateNumber: true,
                },
              },
            },
          }),
          prisma.asset.count({ where }),
        ]);

        handleDbSuccess();
        return {
          assets,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
          },
        };
      } catch (dbError) {
        handleDbFailure(dbError, 'AssetService');
      }
    }

    // Persistent Fallback if MongoDB is offline
    let filtered = [...fallbackAssets];

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

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit).map((asset) => {
      const wipingRecords = fallbackWipingRecords
        .filter((w) => w.assetId === asset.id)
        .map((w) => ({
          id: w.id,
          status: w.status,
          verificationStatus: w.verificationStatus,
          wipingMethod: w.wipingMethod,
        }));

      const disposalRecords = fallbackDisposalRecords
        .filter((d) => d.assetId === asset.id)
        .map((d) => ({
          id: d.id,
          disposalMethod: d.disposalMethod,
          certificateNumber: d.certificateNumber,
        }));

      return {
        ...asset,
        wipingRecords,
        disposalRecords,
      };
    });

    return {
      assets: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single asset by ID including workflow history records.
   */
  async getAssetById(id: string): Promise<any | null> {
    if (shouldTryDb()) {
      try {
        const asset = await prisma.asset.findUnique({
          where: { id },
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
            disposalRecords: {
              orderBy: { createdAt: 'desc' },
              include: {
                officer: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
        });

        if (asset) {
          handleDbSuccess();
          return asset;
        }
      } catch (dbError) {
        handleDbFailure(dbError, 'AssetService');
      }
    }

    return getPopulatedAsset(id);
  }

  /**
   * Creates a new Asset record.
   */
  async createAsset(data: CreateAssetDto): Promise<any> {
    const assetTag = data.assetTag.trim().toUpperCase();
    const serialNumber = data.serialNumber.trim().toUpperCase();
    const assetType = data.assetType.trim();
    const brand = (data.brand || '').trim();
    const model = (data.model || '').trim();
    const department = (data.department || '').trim();
    const purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;

    if (shouldTryDb()) {
      try {
        const existingTag = await prisma.asset.findUnique({ where: { assetTag } });
        if (existingTag) throw new Error('DUPLICATE_ASSET_TAG');

        const existingSerial = await prisma.asset.findUnique({ where: { serialNumber } });
        if (existingSerial) throw new Error('DUPLICATE_SERIAL_NUMBER');

        const created = await prisma.asset.create({
          data: {
            assetTag,
            serialNumber,
            assetType,
            brand,
            model,
            department,
            purchaseDate,
            status: AssetStatus.REGISTERED,
          },
        });

        handleDbSuccess();
        invalidateDashboardCache().catch(() => {});
        return created;
      } catch (dbError: any) {
        if (
          dbError.message === 'DUPLICATE_ASSET_TAG' ||
          dbError.message === 'DUPLICATE_SERIAL_NUMBER'
        ) {
          throw dbError;
        }
        handleDbFailure(dbError, 'AssetService');
      }
    }

    // Persistent Fallback
    const tagExists = fallbackAssets.some((a) => a.assetTag.toUpperCase() === assetTag);
    if (tagExists) throw new Error('DUPLICATE_ASSET_TAG');

    const serialExists = fallbackAssets.some(
      (a) => a.serialNumber.toUpperCase() === serialNumber
    );
    if (serialExists) throw new Error('DUPLICATE_SERIAL_NUMBER');

    const newAsset = {
      id: generateObjectId(),
      assetTag,
      serialNumber,
      assetType,
      brand,
      model,
      department,
      purchaseDate,
      status: AssetStatus.REGISTERED,
      createdAt: new Date(),
      updatedAt: new Date(),
      wipingRecords: [],
      disposalRecords: [],
    };

    fallbackAssets.unshift(newAsset);
    saveFallbackStore();
    invalidateDashboardCache().catch(() => {});
    return newAsset;
  }

  /**
   * Updates an existing Asset record.
   */
  async updateAsset(id: string, data: UpdateAssetDto): Promise<any> {
    if (shouldTryDb()) {
      try {
        const existing = await prisma.asset.findUnique({ where: { id } });
        if (!existing) throw new Error('ASSET_NOT_FOUND');

        const updateData: Prisma.AssetUpdateInput = {};

        if (data.assetTag !== undefined) {
          const tag = data.assetTag.trim().toUpperCase();
          if (tag !== existing.assetTag) {
            const duplicate = await prisma.asset.findUnique({
              where: { assetTag: tag },
            });
            if (duplicate && duplicate.id !== id) {
              throw new Error('DUPLICATE_ASSET_TAG');
            }
            updateData.assetTag = tag;
          }
        }

        if (data.serialNumber !== undefined) {
          const serial = data.serialNumber.trim().toUpperCase();
          if (serial !== existing.serialNumber) {
            const duplicate = await prisma.asset.findUnique({
              where: { serialNumber: serial },
            });
            if (duplicate && duplicate.id !== id) {
              throw new Error('DUPLICATE_SERIAL_NUMBER');
            }
            updateData.serialNumber = serial;
          }
        }

        if (data.assetType !== undefined) updateData.assetType = data.assetType.trim();
        if (data.brand !== undefined) updateData.brand = data.brand.trim();
        if (data.model !== undefined) updateData.model = data.model.trim();
        if (data.department !== undefined) updateData.department = data.department.trim();
        if (data.purchaseDate !== undefined) {
          updateData.purchaseDate = data.purchaseDate
            ? new Date(data.purchaseDate)
            : null;
        }

        const updated = await prisma.asset.update({
          where: { id },
          data: updateData,
        });

        handleDbSuccess();
        invalidateDashboardCache().catch(() => {});
        return updated;
      } catch (dbError: any) {
        if (
          dbError.message === 'ASSET_NOT_FOUND' ||
          dbError.message === 'DUPLICATE_ASSET_TAG' ||
          dbError.message === 'DUPLICATE_SERIAL_NUMBER'
        ) {
          throw dbError;
        }
        handleDbFailure(dbError, 'AssetService');
      }
    }

    // Persistent Fallback
    const index = fallbackAssets.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('ASSET_NOT_FOUND');

    const existing = fallbackAssets[index];
    if (data.assetTag) {
      const tag = data.assetTag.trim().toUpperCase();
      if (
        tag !== existing.assetTag &&
        fallbackAssets.some((a) => a.id !== id && a.assetTag === tag)
      ) {
        throw new Error('DUPLICATE_ASSET_TAG');
      }
      existing.assetTag = tag;
    }

    if (data.serialNumber) {
      const serial = data.serialNumber.trim().toUpperCase();
      if (
        serial !== existing.serialNumber &&
        fallbackAssets.some((a) => a.id !== id && a.serialNumber === serial)
      ) {
        throw new Error('DUPLICATE_SERIAL_NUMBER');
      }
      existing.serialNumber = serial;
    }

    if (data.assetType !== undefined) existing.assetType = data.assetType.trim();
    if (data.brand !== undefined) existing.brand = data.brand.trim();
    if (data.model !== undefined) existing.model = data.model.trim();
    if (data.department !== undefined) existing.department = data.department.trim();
    if (data.purchaseDate !== undefined) {
      existing.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
    }
    existing.updatedAt = new Date();
    saveFallbackStore();
    invalidateDashboardCache().catch(() => {});
    return existing;
  }

  /**
   * Deletes an asset. Enforces permanent history protection.
   */
  async deleteAsset(id: string): Promise<boolean> {
    if (shouldTryDb()) {
      try {
        const asset = await prisma.asset.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                wipingRecords: true,
                disposalRecords: true,
              },
            },
          },
        });

        if (!asset) {
          throw new Error('ASSET_NOT_FOUND');
        }

        const hasHistory =
          asset._count.wipingRecords > 0 || asset._count.disposalRecords > 0;

        if (hasHistory) {
          throw new Error('ASSET_HAS_WORKFLOW_HISTORY');
        }

        await prisma.asset.delete({
          where: { id },
        });

        handleDbSuccess();
        invalidateDashboardCache().catch(() => {});
        return true;
      } catch (dbError: any) {
        if (
          dbError.message === 'ASSET_NOT_FOUND' ||
          dbError.message === 'ASSET_HAS_WORKFLOW_HISTORY'
        ) {
          throw dbError;
        }
        handleDbFailure(dbError, 'AssetService');
      }
    }

    // Persistent Fallback
    const index = fallbackAssets.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('ASSET_NOT_FOUND');

    if (hasAssetWorkflowHistory(id)) {
      throw new Error('ASSET_HAS_WORKFLOW_HISTORY');
    }

    fallbackAssets.splice(index, 1);
    saveFallbackStore();
    invalidateDashboardCache().catch(() => {});
    return true;
  }
}

export const assetService = new AssetService();
