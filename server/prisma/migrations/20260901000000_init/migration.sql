-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'IT_OFFICER', 'DISPOSAL_OFFICER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('REGISTERED', 'WIPING_PENDING', 'WIPING_IN_PROGRESS', 'WIPING_COMPLETED', 'VERIFIED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "WipingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DisposalMethod" AS ENUM ('RECYCLING', 'PHYSICAL_SHREDDING', 'RESALE', 'DONATION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "status" "AssetStatus" NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiping_records" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "wipingMethod" TEXT NOT NULL,
    "wipingTool" TEXT NOT NULL,
    "status" "WipingStatus" NOT NULL DEFAULT 'PENDING',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wiping_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disposal_records" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "disposalMethod" "DisposalMethod" NOT NULL,
    "vendorName" TEXT,
    "certificateNumber" TEXT,
    "remarks" TEXT,
    "disposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disposal_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "assets_assetTag_key" ON "assets"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "assets_serialNumber_key" ON "assets"("serialNumber");

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "assets"("status");

-- CreateIndex
CREATE INDEX "assets_assetType_idx" ON "assets"("assetType");

-- CreateIndex
CREATE INDEX "assets_department_idx" ON "assets"("department");

-- CreateIndex
CREATE INDEX "wiping_records_assetId_idx" ON "wiping_records"("assetId");

-- CreateIndex
CREATE INDEX "wiping_records_technicianId_idx" ON "wiping_records"("technicianId");

-- CreateIndex
CREATE INDEX "wiping_records_status_idx" ON "wiping_records"("status");

-- CreateIndex
CREATE INDEX "wiping_records_verificationStatus_idx" ON "wiping_records"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "disposal_records_certificateNumber_key" ON "disposal_records"("certificateNumber");

-- CreateIndex
CREATE INDEX "disposal_records_assetId_idx" ON "disposal_records"("assetId");

-- CreateIndex
CREATE INDEX "disposal_records_officerId_idx" ON "disposal_records"("officerId");

-- CreateIndex
CREATE INDEX "disposal_records_disposalMethod_idx" ON "disposal_records"("disposalMethod");

-- AddForeignKey
ALTER TABLE "wiping_records" ADD CONSTRAINT "wiping_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiping_records" ADD CONSTRAINT "wiping_records_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiping_records" ADD CONSTRAINT "wiping_records_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disposal_records" ADD CONSTRAINT "disposal_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disposal_records" ADD CONSTRAINT "disposal_records_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
