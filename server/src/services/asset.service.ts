import { AssetStatus, Prisma } from '@prisma/client';
import { prisma } from '../config';
import {
  CreateAssetDto,
  UpdateAssetDto,
  AssetQueryParams,
  PaginatedAssetResponse,
} from '../types/asset.types';

let isDatabaseOnline: boolean | null = null;
let lastDbCheck = 0;

// Fallback in-memory dataset when PostgreSQL is offline
let fallbackAssets: any[] = [
  {
    id: 'f1111111-0001-4000-8000-000000000001',
    assetTag: 'AST-2024-001',
    serialNumber: 'SN-DELL-LAT7420-001',
    assetType: 'Laptop',
    brand: 'Dell',
    model: 'Latitude 7420 vPro',
    department: 'Engineering',
    purchaseDate: new Date('2021-03-15'),
    status: AssetStatus.REGISTERED,
    createdAt: new Date('2026-08-01T10:00:00Z'),
    updatedAt: new Date('2026-08-01T10:00:00Z'),
    wipingRecords: [],
    disposalRecords: [],
  },
  {
    id: 'f1111111-0002-4000-8000-000000000002',
    assetTag: 'AST-2024-002',
    serialNumber: 'SN-APPL-MBP16-002',
    assetType: 'Laptop',
    brand: 'Apple',
    model: 'MacBook Pro 16" M1 Max',
    department: 'Product Design',
    purchaseDate: new Date('2021-11-10'),
    status: AssetStatus.REGISTERED,
    createdAt: new Date('2026-08-02T10:00:00Z'),
    updatedAt: new Date('2026-08-02T10:00:00Z'),
    wipingRecords: [],
    disposalRecords: [],
  },
  {
    id: 'f1111111-0003-4000-8000-000000000003',
    assetTag: 'AST-2024-003',
    serialNumber: 'SN-LEN-T14-003',
    assetType: 'Laptop',
    brand: 'Lenovo',
    model: 'ThinkPad T14 Gen 2',
    department: 'Human Resources',
    purchaseDate: new Date('2020-08-20'),
    status: AssetStatus.WIPING_PENDING,
    createdAt: new Date('2026-08-03T10:00:00Z'),
    updatedAt: new Date('2026-08-03T10:00:00Z'),
    wipingRecords: [
      {
        id: 'w-003',
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge)',
        wipingTool: 'Blancco Drive Eraser v7.8',
        status: 'PENDING',
        verificationStatus: 'PENDING',
        remarks: 'Scheduled for cryptographic erase.',
        createdAt: new Date('2026-08-25T09:00:00Z'),
      },
    ],
    disposalRecords: [],
  },
  {
    id: 'f1111111-0004-4000-8000-000000000004',
    assetTag: 'AST-2024-004',
    serialNumber: 'SN-HP-EB840-004',
    assetType: 'Laptop',
    brand: 'HP',
    model: 'EliteBook 840 G8',
    department: 'Finance',
    purchaseDate: new Date('2021-01-18'),
    status: AssetStatus.WIPING_PENDING,
    createdAt: new Date('2026-08-04T10:00:00Z'),
    updatedAt: new Date('2026-08-04T10:00:00Z'),
    wipingRecords: [],
    disposalRecords: [],
  },
  {
    id: 'f1111111-0005-4000-8000-000000000005',
    assetTag: 'AST-2024-005',
    serialNumber: 'SN-DELL-PWS7820-005',
    assetType: 'Workstation',
    brand: 'Dell',
    model: 'Precision 7820 Tower Workstation',
    department: 'Data Science',
    purchaseDate: new Date('2019-06-12'),
    status: AssetStatus.WIPING_IN_PROGRESS,
    createdAt: new Date('2026-08-05T10:00:00Z'),
    updatedAt: new Date('2026-08-05T10:00:00Z'),
    wipingRecords: [
      {
        id: 'w-005',
        wipingMethod: 'DoD 5220.22-M 3-Pass',
        wipingTool: 'nwipe v0.34',
        status: 'IN_PROGRESS',
        verificationStatus: 'PENDING',
        remarks: 'Pass 2 of 3 in progress.',
        startedAt: new Date('2026-08-26T08:00:00Z'),
        createdAt: new Date('2026-08-26T08:00:00Z'),
      },
    ],
    disposalRecords: [],
  },
  {
    id: 'f1111111-0006-4000-8000-000000000006',
    assetTag: 'AST-2024-006',
    serialNumber: 'SN-HP-Z4G4-006',
    assetType: 'Workstation',
    brand: 'HP',
    model: 'Z4 G4 Workstation Xeon',
    department: 'Engineering',
    purchaseDate: new Date('2019-09-05'),
    status: AssetStatus.WIPING_IN_PROGRESS,
    createdAt: new Date('2026-08-06T10:00:00Z'),
    updatedAt: new Date('2026-08-06T10:00:00Z'),
    wipingRecords: [],
    disposalRecords: [],
  },
  {
    id: 'f1111111-0007-4000-8000-000000000007',
    assetTag: 'AST-2024-007',
    serialNumber: 'SN-DELL-R740-007',
    assetType: 'Rack Server',
    brand: 'Dell',
    model: 'PowerEdge R740 2U Server',
    department: 'Infrastructure & Ops',
    purchaseDate: new Date('2018-05-22'),
    status: AssetStatus.WIPING_COMPLETED,
    createdAt: new Date('2026-08-07T10:00:00Z'),
    updatedAt: new Date('2026-08-07T10:00:00Z'),
    wipingRecords: [
      {
        id: 'w-007',
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge)',
        wipingTool: 'Blancco Enterprise v8.2',
        status: 'COMPLETED',
        verificationStatus: 'PENDING',
        remarks: 'All 8 SAS drives sanitized.',
        completedAt: new Date('2026-08-28T14:30:00Z'),
        createdAt: new Date('2026-08-28T09:00:00Z'),
      },
    ],
    disposalRecords: [],
  },
  {
    id: 'f1111111-0008-4000-8000-000000000008',
    assetTag: 'AST-2024-008',
    serialNumber: 'SN-HPE-DL380-008',
    assetType: 'Rack Server',
    brand: 'HPE',
    model: 'ProLiant DL380 Gen10',
    department: 'Infrastructure & Ops',
    purchaseDate: new Date('2018-10-14'),
    status: AssetStatus.WIPING_COMPLETED,
    createdAt: new Date('2026-08-08T10:00:00Z'),
    updatedAt: new Date('2026-08-08T10:00:00Z'),
    wipingRecords: [],
    disposalRecords: [],
  },
  {
    id: 'f1111111-0009-4000-8000-000000000009',
    assetTag: 'AST-2024-009',
    serialNumber: 'SN-CISCO-C9300-009',
    assetType: 'Enterprise Switch',
    brand: 'Cisco',
    model: 'Catalyst 9300 48-Port PoE+',
    department: 'Network Operations',
    purchaseDate: new Date('2019-02-11'),
    status: AssetStatus.VERIFIED,
    createdAt: new Date('2026-08-09T10:00:00Z'),
    updatedAt: new Date('2026-08-09T10:00:00Z'),
    wipingRecords: [
      {
        id: 'w-009',
        wipingMethod: 'NVRAM Flash Sanitization',
        wipingTool: 'Cisco IOS Secure Erase',
        status: 'COMPLETED',
        verificationStatus: 'VERIFIED',
        remarks: 'All crypto keys erased. Verified by Admin.',
        completedAt: new Date('2026-08-25T11:15:00Z'),
        verifiedAt: new Date('2026-08-25T14:00:00Z'),
        createdAt: new Date('2026-08-25T10:00:00Z'),
      },
    ],
    disposalRecords: [],
  },
  {
    id: 'f1111111-0010-4000-8000-000000000010',
    assetTag: 'AST-2024-010',
    serialNumber: 'SN-PAN-PA3220-010',
    assetType: 'Firewall Appliance',
    brand: 'Palo Alto Networks',
    model: 'PA-3220 Next-Gen Firewall',
    department: 'Information Security',
    purchaseDate: new Date('2019-07-29'),
    status: AssetStatus.VERIFIED,
    createdAt: new Date('2026-08-10T10:00:00Z'),
    updatedAt: new Date('2026-08-10T10:00:00Z'),
    wipingRecords: [],
    disposalRecords: [],
  },
  {
    id: 'f1111111-0011-4000-8000-000000000011',
    assetTag: 'AST-2024-011',
    serialNumber: 'SN-DELL-EMC-ME4024-011',
    assetType: 'SAN Storage Array',
    brand: 'Dell EMC',
    model: 'PowerVault ME4024 Storage',
    department: 'Enterprise Storage',
    purchaseDate: new Date('2017-12-04'),
    status: AssetStatus.DISPOSED,
    createdAt: new Date('2026-08-11T10:00:00Z'),
    updatedAt: new Date('2026-08-01T10:00:00Z'),
    wipingRecords: [
      {
        id: 'w-011',
        wipingMethod: 'NIST SP 800-88 Purge',
        wipingTool: 'Dell Storage Center CLI Wipe',
        status: 'COMPLETED',
        verificationStatus: 'VERIFIED',
        remarks: 'All 24 bays sanitized.',
        completedAt: new Date('2026-08-20T18:00:00Z'),
        createdAt: new Date('2026-08-20T08:00:00Z'),
      },
    ],
    disposalRecords: [
      {
        id: 'd-011',
        disposalMethod: 'RECYCLING',
        vendorName: 'EcoTech Global Recycling Solutions',
        certificateNumber: 'CERT-REC-2026-8801',
        remarks: 'R2v3 certified recycling batch #4401.',
        disposedAt: new Date('2026-08-23T11:00:00Z'),
        createdAt: new Date('2026-08-23T11:00:00Z'),
      },
    ],
  },
  {
    id: 'f1111111-0012-4000-8000-000000000012',
    assetTag: 'AST-2024-012',
    serialNumber: 'SN-LEN-SR650-012',
    assetType: 'Rack Server',
    brand: 'Lenovo',
    model: 'ThinkSystem SR650 2U',
    department: 'Infrastructure & Ops',
    purchaseDate: new Date('2018-04-16'),
    status: AssetStatus.DISPOSED,
    createdAt: new Date('2026-08-12T10:00:00Z'),
    updatedAt: new Date('2026-08-12T10:00:00Z'),
    wipingRecords: [],
    disposalRecords: [
      {
        id: 'd-012',
        disposalMethod: 'PHYSICAL_SHREDDING',
        vendorName: 'SecureShred Industrial Destruction Services',
        certificateNumber: 'CERT-SHRED-2026-9402',
        remarks: 'Cross-cut shredded to DIN 66399 Level H-5.',
        disposedAt: new Date('2026-08-24T14:30:00Z'),
        createdAt: new Date('2026-08-24T14:30:00Z'),
      },
    ],
  },
];

export class AssetService {
  private shouldTryDb(): boolean {
    if (isDatabaseOnline === false) {
      // Re-try after 30 seconds
      if (Date.now() - lastDbCheck < 30000) {
        return false;
      }
    }
    return true;
  }

  private handleDbFailure(_err: any): void {
    isDatabaseOnline = false;
    lastDbCheck = Date.now();
  }

  /**
   * Retrieves paginated, filtered, and searchable list of assets.
   */
  async getAssets(query: AssetQueryParams): Promise<PaginatedAssetResponse> {
    const page = Math.max(1, parseInt(String(query.page || '1'), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(query.limit || '10'), 10)));
    const skip = (page - 1) * limit;

    const { search, status, assetType, department } = query;

    if (this.shouldTryDb()) {
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

        isDatabaseOnline = true;
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
        this.handleDbFailure(dbError);
      }
    }

    // Development Fallback if PostgreSQL is offline
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
    const paginated = filtered.slice(skip, skip + limit);

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
    if (this.shouldTryDb()) {
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
          isDatabaseOnline = true;
          return asset;
        }
      } catch (dbError) {
        this.handleDbFailure(dbError);
      }
    }

    const fallback = fallbackAssets.find((a) => a.id === id);
    return fallback || null;
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

    if (this.shouldTryDb()) {
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

        isDatabaseOnline = true;
        return created;
      } catch (dbError: any) {
        if (
          dbError.message === 'DUPLICATE_ASSET_TAG' ||
          dbError.message === 'DUPLICATE_SERIAL_NUMBER'
        ) {
          throw dbError;
        }
        this.handleDbFailure(dbError);
      }
    }

    // Fallback
    const tagExists = fallbackAssets.some((a) => a.assetTag.toUpperCase() === assetTag);
    if (tagExists) throw new Error('DUPLICATE_ASSET_TAG');

    const serialExists = fallbackAssets.some(
      (a) => a.serialNumber.toUpperCase() === serialNumber
    );
    if (serialExists) throw new Error('DUPLICATE_SERIAL_NUMBER');

    const newAsset = {
      id: `ast-${Date.now()}`,
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
    return newAsset;
  }

  /**
   * Updates an existing Asset record.
   */
  async updateAsset(id: string, data: UpdateAssetDto): Promise<any> {
    if (this.shouldTryDb()) {
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

        isDatabaseOnline = true;
        return updated;
      } catch (dbError: any) {
        if (
          dbError.message === 'ASSET_NOT_FOUND' ||
          dbError.message === 'DUPLICATE_ASSET_TAG' ||
          dbError.message === 'DUPLICATE_SERIAL_NUMBER'
        ) {
          throw dbError;
        }
        this.handleDbFailure(dbError);
      }
    }

    // Fallback
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

    return existing;
  }

  /**
   * Deletes an asset.
   */
  async deleteAsset(id: string): Promise<boolean> {
    if (this.shouldTryDb()) {
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

        isDatabaseOnline = true;
        return true;
      } catch (dbError: any) {
        if (
          dbError.message === 'ASSET_NOT_FOUND' ||
          dbError.message === 'ASSET_HAS_WORKFLOW_HISTORY'
        ) {
          throw dbError;
        }
        this.handleDbFailure(dbError);
      }
    }

    // Fallback
    const index = fallbackAssets.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('ASSET_NOT_FOUND');

    const item = fallbackAssets[index];
    const hasHistory =
      (item.wipingRecords && item.wipingRecords.length > 0) ||
      (item.disposalRecords && item.disposalRecords.length > 0);

    if (hasHistory) {
      throw new Error('ASSET_HAS_WORKFLOW_HISTORY');
    }

    fallbackAssets.splice(index, 1);
    return true;
  }
}

export const assetService = new AssetService();
