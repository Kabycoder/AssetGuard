import { DisposalMethod } from '@prisma/client';

export interface CreateDisposalDto {
  disposalMethod: DisposalMethod;
  vendorName?: string;
  certificateNumber?: string;
  remarks?: string;
}

export interface DisposalQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  disposalMethod?: string;
  vendorName?: string;
  department?: string;
}

export interface DisposalRecordResponse {
  id: string;
  assetId: string;
  officerId: string;
  disposalMethod: DisposalMethod;
  vendorName?: string | null;
  certificateNumber?: string | null;
  remarks?: string | null;
  disposedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  asset?: {
    id: string;
    assetTag: string;
    serialNumber: string;
    assetType: string;
    brand: string;
    model: string;
    department: string;
    status: string;
  };
  officer?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface PaginatedDisposalResponse {
  records: DisposalRecordResponse[];
  verifiedQueue: any[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
