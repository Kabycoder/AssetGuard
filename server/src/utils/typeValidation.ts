import {
  Prisma,
  Role,
  AssetStatus,
  WipingStatus,
  VerificationStatus,
  DisposalMethod,
  User,
  Asset,
  WipingRecord,
  DisposalRecord,
} from '@prisma/client';
import prisma from '../config/prisma';

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    wipingRecordsPerformed: true;
    wipingRecordsVerified: true;
    disposalRecordsPerformed: true;
  };
}>;

export type AssetWithRelations = Prisma.AssetGetPayload<{
  include: {
    wipingRecords: {
      include: {
        technician: true;
        verifiedBy: true;
      };
    };
    disposalRecords: {
      include: {
        officer: true;
      };
    };
  };
}>;

export type WipingRecordWithRelations = Prisma.WipingRecordGetPayload<{
  include: {
    asset: true;
    technician: true;
    verifiedBy: true;
  };
}>;

export type DisposalRecordWithRelations = Prisma.DisposalRecordGetPayload<{
  include: {
    asset: true;
    officer: true;
  };
}>;

export interface PrismaTypeValidationSummary {
  userCount: number;
  assetCount: number;
  wipingCount: number;
  disposalCount: number;
  enums: {
    roles: Role[];
    assetStatuses: AssetStatus[];
    wipingStatuses: WipingStatus[];
    verificationStatuses: VerificationStatus[];
    disposalMethods: DisposalMethod[];
  };
}

/**
 * Validates runtime availability and compile-time type definitions.
 */
export function getPrismaSchemaMetadata(): PrismaTypeValidationSummary {
  const meta: PrismaTypeValidationSummary = {
    userCount: 0,
    assetCount: 0,
    wipingCount: 0,
    disposalCount: 0,
    enums: {
      roles: Object.values(Role),
      assetStatuses: Object.values(AssetStatus),
      wipingStatuses: Object.values(WipingStatus),
      verificationStatuses: Object.values(VerificationStatus),
      disposalMethods: Object.values(DisposalMethod),
    },
  };

  if (!prisma) {
    throw new Error('Prisma client singleton is not defined');
  }

  return meta;
}

export { User, Asset, WipingRecord, DisposalRecord };
