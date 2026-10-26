import fs from 'fs';
import path from 'path';
import { AssetStatus, DisposalMethod, WipingStatus, VerificationStatus, Role } from '@prisma/client';
import { logger } from '../utils/logger';

export interface FallbackUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const FALLBACK_USERS: Record<string, FallbackUser> = {
  ADMIN: {
    id: 'a1b2c3d4e5f64a1b8c2d3e4f',
    name: 'Sarah Chen (Admin)',
    email: 'admin@assetguard.local',
    role: 'ADMIN',
  },
  IT_OFFICER: {
    id: 'b2c3d4e5f6a14b2c9d3e4f5a',
    name: 'David Kim (IT Officer)',
    email: 'it@assetguard.local',
    role: 'IT_OFFICER',
  },
  DISPOSAL_OFFICER: {
    id: 'c3d4e5f6a1b24c3dae4f5a6b',
    name: 'Marcus Vance (Disposal Officer)',
    email: 'disposal@assetguard.local',
    role: 'DISPOSAL_OFFICER',
  },
};

// Initial baseline seed assets if persistent store does not exist yet
const INITIAL_ASSETS: any[] = [
  {
    id: '66e100000000000000000001',
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
  },
  {
    id: '66e100000000000000000002',
    assetTag: 'AST-2024-002',
    serialNumber: 'SN-APPL-MBP16-002',
    assetType: 'Laptop',
    brand: 'Apple',
    model: 'MacBook Pro 16" M1 Max',
    department: 'Product Design',
    purchaseDate: new Date('2021-11-20'),
    status: AssetStatus.WIPING_PENDING,
    createdAt: new Date('2026-08-02T10:00:00Z'),
    updatedAt: new Date('2026-08-02T10:00:00Z'),
  },
  {
    id: '66e100000000000000000003',
    assetTag: 'AST-2024-003',
    serialNumber: 'SN-LEN-X1C9-003',
    assetType: 'Laptop',
    brand: 'Lenovo',
    model: 'ThinkPad X1 Carbon Gen 9',
    department: 'Finance',
    purchaseDate: new Date('2020-08-10'),
    status: AssetStatus.WIPING_PENDING,
    createdAt: new Date('2026-08-03T10:00:00Z'),
    updatedAt: new Date('2026-08-03T10:00:00Z'),
  },
  {
    id: '66e100000000000000000004',
    assetTag: 'AST-2024-004',
    serialNumber: 'SN-DELL-OPT7080-004',
    assetType: 'Desktop',
    brand: 'Dell',
    model: 'OptiPlex 7080 Micro',
    department: 'Human Resources',
    purchaseDate: new Date('2020-01-18'),
    status: AssetStatus.WIPING_PENDING,
    createdAt: new Date('2026-08-04T10:00:00Z'),
    updatedAt: new Date('2026-08-04T10:00:00Z'),
  },
  {
    id: '66e100000000000000000005',
    assetTag: 'AST-2024-005',
    serialNumber: 'SN-LEN-P340-005',
    assetType: 'Workstation',
    brand: 'Lenovo',
    model: 'ThinkStation P340 Tiny',
    department: 'Data Science',
    purchaseDate: new Date('2021-06-30'),
    status: AssetStatus.WIPING_IN_PROGRESS,
    createdAt: new Date('2026-08-05T10:00:00Z'),
    updatedAt: new Date('2026-08-26T09:30:00Z'),
  },
  {
    id: '66e100000000000000000006',
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
  },
  {
    id: '66e100000000000000000007',
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
  },
  {
    id: '66e100000000000000000008',
    assetTag: 'AST-2024-008',
    serialNumber: 'SN-HPE-DL380-008',
    assetType: 'Rack Server',
    brand: 'HPE',
    model: 'ProLiant DL380 Gen10',
    department: 'Infrastructure',
    purchaseDate: new Date('2018-12-01'),
    status: AssetStatus.WIPING_COMPLETED,
    createdAt: new Date('2026-08-08T10:00:00Z'),
    updatedAt: new Date('2026-08-29T16:00:00Z'),
  },
  {
    id: '66e100000000000000000009',
    assetTag: 'AST-2024-009',
    serialNumber: 'SN-CISCO-C9300-009',
    assetType: 'Enterprise Switch',
    brand: 'Cisco',
    model: 'Catalyst 9300 48-Port',
    department: 'Networking',
    purchaseDate: new Date('2019-04-14'),
    status: AssetStatus.VERIFIED,
    createdAt: new Date('2026-08-09T10:00:00Z'),
    updatedAt: new Date('2026-08-29T17:00:00Z'),
  },
  {
    id: '66e100000000000000000010',
    assetTag: 'AST-2024-010',
    serialNumber: 'SN-NTAP-FAS2750-010',
    assetType: 'SAN Storage Array',
    brand: 'NetApp',
    model: 'FAS2750 Array',
    department: 'Enterprise Storage',
    purchaseDate: new Date('2017-09-30'),
    status: AssetStatus.DISPOSED,
    createdAt: new Date('2026-08-10T10:00:00Z'),
    updatedAt: new Date('2026-08-30T11:00:00Z'),
  },
  {
    id: '66e100000000000000000011',
    assetTag: 'AST-2024-011',
    serialNumber: 'SN-APPL-IPAD12-011',
    assetType: 'Tablet',
    brand: 'Apple',
    model: 'iPad Pro 12.9',
    department: 'Executive',
    purchaseDate: new Date('2021-05-12'),
    status: AssetStatus.DISPOSED,
    createdAt: new Date('2026-08-11T10:00:00Z'),
    updatedAt: new Date('2026-08-31T15:30:00Z'),
  },
];

const INITIAL_WIPING_RECORDS: any[] = [
  {
    id: '66e200000000000000000005',
    assetId: '66e100000000000000000005',
    technicianId: 'b2c3d4e5f6a14b2c9d3e4f5a',
    technician: FALLBACK_USERS.IT_OFFICER,
    wipingMethod: 'DoD 5220.22-M 3-Pass',
    wipingTool: 'nwipe v0.34',
    status: WipingStatus.IN_PROGRESS,
    verificationStatus: VerificationStatus.PENDING,
    remarks: 'Pass 2 of 3 in progress.',
    startedAt: new Date('2026-08-26T08:00:00Z'),
    completedAt: null,
    verifiedAt: null,
    createdAt: new Date('2026-08-26T08:00:00Z'),
    updatedAt: new Date('2026-08-26T08:00:00Z'),
  },
  {
    id: '66e200000000000000000007',
    assetId: '66e100000000000000000007',
    technicianId: 'b2c3d4e5f6a14b2c9d3e4f5a',
    technician: FALLBACK_USERS.IT_OFFICER,
    wipingMethod: 'NIST SP 800-88 Rev 1 (Purge)',
    wipingTool: 'Blancco Enterprise v8.2',
    status: WipingStatus.COMPLETED,
    verificationStatus: VerificationStatus.PENDING,
    remarks: 'All 8 SAS drives sanitized.',
    startedAt: new Date('2026-08-28T09:00:00Z'),
    completedAt: new Date('2026-08-28T14:30:00Z'),
    verifiedAt: null,
    createdAt: new Date('2026-08-28T09:00:00Z'),
    updatedAt: new Date('2026-08-28T14:30:00Z'),
  },
  {
    id: '66e200000000000000000008',
    assetId: '66e100000000000000000008',
    technicianId: 'b2c3d4e5f6a14b2c9d3e4f5a',
    technician: FALLBACK_USERS.IT_OFFICER,
    wipingMethod: 'DoD 5220.22-M 7-Pass (Enhanced Sanitization)',
    wipingTool: 'Active@ KillDisk Pro v24.0',
    status: WipingStatus.COMPLETED,
    verificationStatus: VerificationStatus.PENDING,
    remarks: 'Re-wiping completed successfully.',
    startedAt: new Date('2026-08-29T08:15:00Z'),
    completedAt: new Date('2026-08-29T16:45:00Z'),
    verifiedAt: null,
    verifiedBy: null,
    createdAt: new Date('2026-08-29T08:15:00Z'),
    updatedAt: new Date('2026-08-29T16:45:00Z'),
  },
];

const INITIAL_DISPOSAL_RECORDS: any[] = [
  {
    id: '66e300000000000000000010',
    assetId: '66e100000000000000000010',
    officerId: 'c3d4e5f6a1b24c3dae4f5a6b',
    officer: FALLBACK_USERS.DISPOSAL_OFFICER,
    disposalMethod: DisposalMethod.RECYCLING,
    vendorName: 'EcoRecycle Solutions Inc.',
    certificateNumber: 'COD-202608-9841',
    remarks: 'Certified R2 recycling process completed.',
    disposedAt: new Date('2026-08-30T11:00:00Z'),
    createdAt: new Date('2026-08-30T11:00:00Z'),
    updatedAt: new Date('2026-08-30T11:00:00Z'),
  },
  {
    id: '66e300000000000000000011',
    assetId: '66e100000000000000000011',
    officerId: 'c3d4e5f6a1b24c3dae4f5a6b',
    officer: FALLBACK_USERS.DISPOSAL_OFFICER,
    disposalMethod: DisposalMethod.PHYSICAL_SHREDDING,
    vendorName: 'SecureDestruct Pro',
    certificateNumber: 'COD-202608-9842',
    remarks: 'Physical particle shredding down to 2mm cross-cut.',
    disposedAt: new Date('2026-08-31T15:30:00Z'),
    createdAt: new Date('2026-08-31T15:30:00Z'),
    updatedAt: new Date('2026-08-31T15:30:00Z'),
  },
];

// Persistent File Storage Path
const PERSISTENT_STORE_FILE = path.join(__dirname, 'persistentFallback.json');

// Memory arrays
export let fallbackAssets: any[] = [];
export let fallbackWipingRecords: any[] = [];
export let fallbackDisposalRecords: any[] = [];

/**
 * Parses date fields from JSON representations
 */
function reviveDates(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(reviveDates);

  const res: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ) {
      res[key] = new Date(value);
    } else if (typeof value === 'object' && value !== null) {
      res[key] = reviveDates(value);
    } else {
      res[key] = value;
    }
  }
  return res;
}

const isRunningTests =
  process.env.NODE_ENV === 'test' ||
  process.argv.some(
    (arg) => arg.includes('test-') || arg.includes('test.') || arg.includes('test:')
  );

/**
 * Loads data from disk file or initializes defaults
 */
function initStore(): void {
  if (!isRunningTests) {
    try {
      if (fs.existsSync(PERSISTENT_STORE_FILE)) {
        const content = fs.readFileSync(PERSISTENT_STORE_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        fallbackAssets = reviveDates(parsed.assets || []);
        fallbackWipingRecords = reviveDates(parsed.wipingRecords || []);
        fallbackDisposalRecords = reviveDates(parsed.disposalRecords || []);
        logger.info(
          `[FallbackStore] Loaded ${fallbackAssets.length} assets, ${fallbackWipingRecords.length} wiping records, and ${fallbackDisposalRecords.length} disposal records from persistent store.`
        );
        return;
      }
    } catch (err: any) {
      logger.warn(`[FallbackStore] Error loading persistent store: ${err.message}. Using baseline seed.`);
    }
  }

  // Initialize with baseline data
  fallbackAssets = INITIAL_ASSETS.map((a) => ({ ...a }));
  fallbackWipingRecords = INITIAL_WIPING_RECORDS.map((w) => ({ ...w }));
  fallbackDisposalRecords = INITIAL_DISPOSAL_RECORDS.map((d) => ({ ...d }));
  if (!isRunningTests) {
    saveFallbackStore();
  }
}

/**
 * Persists current in-memory records to disk
 */
export function saveFallbackStore(): void {
  if (isRunningTests) return;
  try {
    const payload = {
      assets: fallbackAssets,
      wipingRecords: fallbackWipingRecords,
      disposalRecords: fallbackDisposalRecords,
      savedAt: new Date().toISOString(),
    };
    fs.writeFileSync(PERSISTENT_STORE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err: any) {
    logger.warn(`[FallbackStore] Failed to persist fallback store to disk: ${err.message}`);
  }
}

/**
 * Resets fallback store to clean baseline (used in test suites)
 */
export function resetFallbackStore(): void {
  fallbackAssets = INITIAL_ASSETS.map((a) => ({ ...a }));
  fallbackWipingRecords = INITIAL_WIPING_RECORDS.map((w) => ({ ...w }));
  fallbackDisposalRecords = INITIAL_DISPOSAL_RECORDS.map((d) => ({ ...d }));
}

// Initialize on module load
initStore();

// ====================================================
// Shared Database Connectivity Manager
// ====================================================
let isDatabaseOnline: boolean | null = null;
let lastDbCheck = 0;
const DB_RETRY_INTERVAL_MS = 15000;

export function shouldTryDb(): boolean {
  if (isDatabaseOnline === false) {
    if (Date.now() - lastDbCheck < DB_RETRY_INTERVAL_MS) {
      return false;
    }
  }
  return true;
}

export function handleDbSuccess(): void {
  isDatabaseOnline = true;
}

export function handleDbFailure(err?: any, serviceName = 'Service'): void {
  isDatabaseOnline = false;
  lastDbCheck = Date.now();
  if (err) {
    logger.warn(`[${serviceName}] Database connection unavailable (${err?.message || err}). Operating in persistent fallback mode.`);
  }
}

export function isDbOnline(): boolean {
  return isDatabaseOnline === true;
}

// ====================================================
// Relational Helpers
// ====================================================

/**
 * Returns an asset with its latest wipingRecords and disposalRecords attached
 */
export function getPopulatedAsset(assetId: string): any | null {
  const asset = fallbackAssets.find((a) => a.id === assetId);
  if (!asset) return null;

  const wipingRecords = fallbackWipingRecords
    .filter((w) => w.assetId === assetId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const disposalRecords = fallbackDisposalRecords
    .filter((d) => d.assetId === assetId)
    .sort((a, b) => new Date(b.disposedAt || b.createdAt).getTime() - new Date(a.disposedAt || a.createdAt).getTime());

  return {
    ...asset,
    wipingRecords,
    disposalRecords,
    activeWipingRecord: wipingRecords.length > 0 ? wipingRecords[0] : null,
  };
}

/**
 * Checks if an asset has any workflow history (wiping or disposal records)
 */
export function hasAssetWorkflowHistory(assetId: string): boolean {
  const hasWiping = fallbackWipingRecords.some((w) => w.assetId === assetId);
  const hasDisposal = fallbackDisposalRecords.some((d) => d.assetId === assetId);
  return hasWiping || hasDisposal;
}

/**
 * Dynamically builds recent dashboard activities from real records
 */
export function getFallbackRecentActivity(userRole: Role): any[] {
  const activities: any[] = [];

  // 1. Asset registrations
  if (userRole === Role.ADMIN || userRole === Role.IT_OFFICER) {
    fallbackAssets.forEach((asset) => {
      activities.push({
        id: `asset-${asset.id}`,
        assetTag: asset.assetTag,
        action: 'Asset Registered',
        status: asset.status,
        timestamp: asset.createdAt,
        assetType: asset.assetType,
        details: 'New IT hardware enrolled in inventory',
      });
    });
  }

  // 2. Sanitization & Verification events
  if (userRole === Role.ADMIN || userRole === Role.IT_OFFICER || userRole === Role.DISPOSAL_OFFICER) {
    fallbackWipingRecords.forEach((wiping) => {
      const asset = fallbackAssets.find((a) => a.id === wiping.assetId);
      const tag = asset?.assetTag || 'AST-RECORD';
      const type = asset?.assetType || 'Hardware';

      if (wiping.status === WipingStatus.IN_PROGRESS) {
        activities.push({
          id: `wiping-${wiping.id}-progress`,
          assetTag: tag,
          action: 'Wiping Started',
          status: 'WIPING_IN_PROGRESS',
          timestamp: wiping.startedAt || wiping.updatedAt,
          assetType: type,
          userName: wiping.technician?.name || 'IT Technician',
          details: `Sanitization initiated using ${wiping.wipingMethod}`,
        });
      } else if (wiping.status === WipingStatus.COMPLETED && wiping.verificationStatus === VerificationStatus.PENDING) {
        activities.push({
          id: `wiping-${wiping.id}-completed`,
          assetTag: tag,
          action: 'Wiping Completed',
          status: 'WIPING_COMPLETED',
          timestamp: wiping.completedAt || wiping.updatedAt,
          assetType: type,
          userName: wiping.technician?.name || 'IT Technician',
          details: `Erasure completed via ${wiping.wipingTool}. Awaiting verification.`,
        });
      } else if (wiping.status === WipingStatus.FAILED) {
        activities.push({
          id: `wiping-${wiping.id}-failed`,
          assetTag: tag,
          action: 'Wiping Failed',
          status: 'FAILED',
          timestamp: wiping.updatedAt,
          assetType: type,
          userName: wiping.technician?.name || 'IT Technician',
          details: wiping.remarks || 'Sanitization process failed diagnostic check',
        });
      }

      if (wiping.verificationStatus === VerificationStatus.VERIFIED) {
        activities.push({
          id: `verification-${wiping.id}-verified`,
          assetTag: tag,
          action: 'Wiping Verified',
          status: 'VERIFIED',
          timestamp: wiping.verifiedAt || wiping.updatedAt,
          assetType: type,
          userName: wiping.verifiedBy?.name || 'Security Auditor',
          details: 'Cryptographic wiping audit passed & certified',
        });
      } else if (wiping.verificationStatus === VerificationStatus.REJECTED) {
        activities.push({
          id: `verification-${wiping.id}-rejected`,
          assetTag: tag,
          action: 'Wiping Rejected',
          status: 'REJECTED',
          timestamp: wiping.updatedAt,
          assetType: type,
          userName: wiping.verifiedBy?.name || 'Security Auditor',
          details: wiping.rejectionReason || 'Sanitization audit failed QA check',
        });
      }
    });
  }

  // 3. Disposal events
  if (userRole === Role.ADMIN || userRole === Role.DISPOSAL_OFFICER) {
    fallbackDisposalRecords.forEach((disposal) => {
      const asset = fallbackAssets.find((a) => a.id === disposal.assetId);
      const tag = asset?.assetTag || disposal.asset?.assetTag || 'AST-DISPOSED';
      const type = asset?.assetType || disposal.asset?.assetType || 'Hardware';

      activities.push({
        id: `disposal-${disposal.id}`,
        assetTag: tag,
        action: 'Asset Disposed',
        status: 'DISPOSED',
        timestamp: disposal.disposedAt || disposal.createdAt,
        assetType: type,
        userName: disposal.officer?.name || 'Disposal Officer',
        details: `Processed via ${disposal.disposalMethod} (${disposal.vendorName || 'In-house'})`,
      });
    });
  }

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);
}
