import {
  PrismaClient,
  Role,
  AssetStatus,
  WipingStatus,
  VerificationStatus,
  DisposalMethod,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Common development password for all demo accounts
export const DEFAULT_SEED_PASSWORD = 'Password123!';

async function main() {
  console.log('🌱 Starting AssetGuard database seed...');

  // 1. Clean up existing records in reverse dependency order
  console.log('🧹 Cleaning existing records...');
  await prisma.disposalRecord.deleteMany();
  await prisma.wipingRecord.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default seed password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(DEFAULT_SEED_PASSWORD, saltRounds);

  // 3. Create Demo Users
  console.log('👤 Creating demo users...');
  const adminUser = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'admin@assetguard.local',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const itOfficerUser = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'it@assetguard.local',
      passwordHash,
      role: Role.IT_OFFICER,
    },
  });

  const disposalOfficerUser = await prisma.user.create({
    data: {
      name: 'Marcus Chen',
      email: 'disposal@assetguard.local',
      passwordHash,
      role: Role.DISPOSAL_OFFICER,
    },
  });

  console.log(`✅ Created 3 demo users:`);
  console.log(`   - Admin:            ${adminUser.email} (Role: ADMIN)`);
  console.log(`   - IT Officer:       ${itOfficerUser.email} (Role: IT_OFFICER)`);
  console.log(`   - Disposal Officer: ${disposalOfficerUser.email} (Role: DISPOSAL_OFFICER)`);
  console.log(`   - Default Password: ${DEFAULT_SEED_PASSWORD}`);

  // 4. Create 12 Realistic IT Assets across lifecycle stages
  console.log('💻 Creating realistic IT assets...');

  const assetData = [
    {
      assetTag: 'AST-2024-001',
      serialNumber: 'SN-DELL-LAT7420-001',
      assetType: 'Laptop',
      brand: 'Dell',
      model: 'Latitude 7420 vPro',
      department: 'Engineering',
      purchaseDate: new Date('2021-03-15'),
      status: AssetStatus.REGISTERED,
    },
    {
      assetTag: 'AST-2024-002',
      serialNumber: 'SN-APPL-MBP16-002',
      assetType: 'Laptop',
      brand: 'Apple',
      model: 'MacBook Pro 16" M1 Max',
      department: 'Product Design',
      purchaseDate: new Date('2021-11-10'),
      status: AssetStatus.REGISTERED,
    },
    {
      assetTag: 'AST-2024-003',
      serialNumber: 'SN-LEN-T14-003',
      assetType: 'Laptop',
      brand: 'Lenovo',
      model: 'ThinkPad T14 Gen 2',
      department: 'Human Resources',
      purchaseDate: new Date('2020-08-20'),
      status: AssetStatus.WIPING_PENDING,
    },
    {
      assetTag: 'AST-2024-004',
      serialNumber: 'SN-HP-EB840-004',
      assetType: 'Laptop',
      brand: 'HP',
      model: 'EliteBook 840 G8',
      department: 'Finance',
      purchaseDate: new Date('2021-01-18'),
      status: AssetStatus.WIPING_PENDING,
    },
    {
      assetTag: 'AST-2024-005',
      serialNumber: 'SN-DELL-PWS7820-005',
      assetType: 'Workstation',
      brand: 'Dell',
      model: 'Precision 7820 Tower Workstation',
      department: 'Data Science',
      purchaseDate: new Date('2019-06-12'),
      status: AssetStatus.WIPING_IN_PROGRESS,
    },
    {
      assetTag: 'AST-2024-006',
      serialNumber: 'SN-HP-Z4G4-006',
      assetType: 'Workstation',
      brand: 'HP',
      model: 'Z4 G4 Workstation Xeon',
      department: 'Engineering',
      purchaseDate: new Date('2019-09-05'),
      status: AssetStatus.WIPING_IN_PROGRESS,
    },
    {
      assetTag: 'AST-2024-007',
      serialNumber: 'SN-DELL-R740-007',
      assetType: 'Rack Server',
      brand: 'Dell',
      model: 'PowerEdge R740 2U Server',
      department: 'Infrastructure & Ops',
      purchaseDate: new Date('2018-05-22'),
      status: AssetStatus.WIPING_COMPLETED,
    },
    {
      assetTag: 'AST-2024-008',
      serialNumber: 'SN-HPE-DL380-008',
      assetType: 'Rack Server',
      brand: 'HPE',
      model: 'ProLiant DL380 Gen10',
      department: 'Infrastructure & Ops',
      purchaseDate: new Date('2018-10-14'),
      status: AssetStatus.WIPING_COMPLETED,
    },
    {
      assetTag: 'AST-2024-009',
      serialNumber: 'SN-CISCO-C9300-009',
      assetType: 'Enterprise Switch',
      brand: 'Cisco',
      model: 'Catalyst 9300 48-Port PoE+',
      department: 'Network Operations',
      purchaseDate: new Date('2019-02-11'),
      status: AssetStatus.VERIFIED,
    },
    {
      assetTag: 'AST-2024-010',
      serialNumber: 'SN-PAN-PA3220-010',
      assetType: 'Firewall Appliance',
      brand: 'Palo Alto Networks',
      model: 'PA-3220 Next-Gen Firewall',
      department: 'Information Security',
      purchaseDate: new Date('2019-07-29'),
      status: AssetStatus.VERIFIED,
    },
    {
      assetTag: 'AST-2024-011',
      serialNumber: 'SN-DELL-EMC-ME4024-011',
      assetType: 'SAN Storage Array',
      brand: 'Dell EMC',
      model: 'PowerVault ME4024 Storage',
      department: 'Enterprise Storage',
      purchaseDate: new Date('2017-12-04'),
      status: AssetStatus.DISPOSED,
    },
    {
      assetTag: 'AST-2024-012',
      serialNumber: 'SN-LEN-SR650-012',
      assetType: 'Rack Server',
      brand: 'Lenovo',
      model: 'ThinkSystem SR650 2U',
      department: 'Infrastructure & Ops',
      purchaseDate: new Date('2018-04-16'),
      status: AssetStatus.DISPOSED,
    },
  ];

  const createdAssets: Record<string, typeof assetData[0] & { id: string }> = {};

  for (const item of assetData) {
    const asset = await prisma.asset.create({
      data: item,
    });
    createdAssets[item.assetTag] = { ...item, id: asset.id };
  }

  console.log(`✅ Created ${assetData.length} IT assets across all lifecycle statuses.`);

  // 5. Create Realistic Wiping Records
  console.log('🧹 Creating wiping records...');

  // Asset 3 (WIPING_PENDING) -> Queue record
  await prisma.wipingRecord.create({
    data: {
      assetId: createdAssets['AST-2024-003'].id,
      technicianId: itOfficerUser.id,
      wipingMethod: 'NIST SP 800-88 Rev 1 (Purge / Cryptographic Erase)',
      wipingTool: 'Blancco Drive Eraser v7.8',
      status: WipingStatus.PENDING,
      verificationStatus: VerificationStatus.PENDING,
      remarks: 'Scheduled for cryptographic erase after decommissioning.',
    },
  });

  // Asset 5 (WIPING_IN_PROGRESS)
  await prisma.wipingRecord.create({
    data: {
      assetId: createdAssets['AST-2024-005'].id,
      technicianId: itOfficerUser.id,
      wipingMethod: 'DoD 5220.22-M (3-Pass Overwrite with Pattern Verification)',
      wipingTool: 'nwipe v0.34 CLI engine',
      status: WipingStatus.IN_PROGRESS,
      verificationStatus: VerificationStatus.PENDING,
      startedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      remarks: 'Pass 2 of 3 currently in progress (67% complete).',
    },
  });

  // Asset 6 (WIPING_IN_PROGRESS)
  await prisma.wipingRecord.create({
    data: {
      assetId: createdAssets['AST-2024-006'].id,
      technicianId: itOfficerUser.id,
      wipingMethod: 'NIST SP 800-88 Rev 1 (Clear / 1-Pass Zero Fill)',
      wipingTool: 'DBAN v2.3.0 DoD Kernel',
      status: WipingStatus.IN_PROGRESS,
      verificationStatus: VerificationStatus.PENDING,
      startedAt: new Date(Date.now() - 1800000), // 30 min ago
      remarks: 'Fast NVMe drive zeroing initiated on test bench B.',
    },
  });

  // Asset 7 (WIPING_COMPLETED - Awaiting Admin Verification)
  await prisma.wipingRecord.create({
    data: {
      assetId: createdAssets['AST-2024-007'].id,
      technicianId: itOfficerUser.id,
      wipingMethod: 'NIST SP 800-88 Rev 1 (Purge / Block Erase)',
      wipingTool: 'Blancco Enterprise Data Eraser v8.2',
      status: WipingStatus.COMPLETED,
      verificationStatus: VerificationStatus.PENDING,
      startedAt: new Date('2026-08-28T09:00:00Z'),
      completedAt: new Date('2026-08-28T14:30:00Z'),
      remarks: 'All 8 SAS drives successfully purged. Checksum verification passed.',
    },
  });

  // Asset 8 (WIPING_COMPLETED - Rejected previously, re-wiped)
  await prisma.wipingRecord.create({
    data: {
      assetId: createdAssets['AST-2024-008'].id,
      technicianId: itOfficerUser.id,
      wipingMethod: 'DoD 5220.22-M 7-Pass (Enhanced Sanitization)',
      wipingTool: 'Active@ KillDisk Pro v24.0',
      status: WipingStatus.COMPLETED,
      verificationStatus: VerificationStatus.PENDING,
      startedAt: new Date('2026-08-29T08:15:00Z'),
      completedAt: new Date('2026-08-29T16:45:00Z'),
      remarks: 'Re-wiping completed after previous sector read warning.',
    },
  });

  // Asset 9 (VERIFIED - Verified by Admin)
  await prisma.wipingRecord.create({
    data: {
      assetId: createdAssets['AST-2024-009'].id,
      technicianId: itOfficerUser.id,
      wipingMethod: 'NVRAM Flash Sanitization & Factory Reset',
      wipingTool: 'Cisco IOS Secure Erase Engine',
      status: WipingStatus.COMPLETED,
      verificationStatus: VerificationStatus.VERIFIED,
      startedAt: new Date('2026-08-25T10:00:00Z'),
      completedAt: new Date('2026-08-25T11:15:00Z'),
      verifiedAt: new Date('2026-08-25T14:00:00Z'),
      verifiedById: adminUser.id,
      remarks: 'All running-config, VLAN dat, and private crypto keys erased.',
    },
  });

  // Asset 10 (VERIFIED - Verified by Admin)
  await prisma.wipingRecord.create({
    data: {
      assetId: createdAssets['AST-2024-010'].id,
      technicianId: itOfficerUser.id,
      wipingMethod: 'PanOS Maintenance Erase / FIPS Zeroization',
      wipingTool: 'Palo Alto Maintenance Mode Zeroizer',
      status: WipingStatus.COMPLETED,
      verificationStatus: VerificationStatus.VERIFIED,
      startedAt: new Date('2026-08-26T13:00:00Z'),
      completedAt: new Date('2026-08-26T14:45:00Z'),
      verifiedAt: new Date('2026-08-26T17:30:00Z'),
      verifiedById: adminUser.id,
      remarks: 'Master key and root partition zeroized per NIST guidelines.',
    },
  });

  // Asset 11 (DISPOSED - Verified & Purged)
  await prisma.wipingRecord.create({
    data: {
      assetId: createdAssets['AST-2024-011'].id,
      technicianId: itOfficerUser.id,
      wipingMethod: 'NIST SP 800-88 Rev 1 (Purge / Cryptographic Erase)',
      wipingTool: 'Dell Storage Center CLI Wipe',
      status: WipingStatus.COMPLETED,
      verificationStatus: VerificationStatus.VERIFIED,
      startedAt: new Date('2026-08-20T08:00:00Z'),
      completedAt: new Date('2026-08-20T18:00:00Z'),
      verifiedAt: new Date('2026-08-21T09:30:00Z'),
      verifiedById: adminUser.id,
      remarks: 'Array decommission complete. All 24 SSD/HDD bays sanitized.',
    },
  });

  // Asset 12 (DISPOSED - Verified & Purged)
  await prisma.wipingRecord.create({
    data: {
      assetId: createdAssets['AST-2024-012'].id,
      technicianId: itOfficerUser.id,
      wipingMethod: 'DoD 5220.22-M 3-Pass',
      wipingTool: 'Blancco Drive Eraser v7.8',
      status: WipingStatus.COMPLETED,
      verificationStatus: VerificationStatus.VERIFIED,
      startedAt: new Date('2026-08-22T09:00:00Z'),
      completedAt: new Date('2026-08-22T13:30:00Z'),
      verifiedAt: new Date('2026-08-22T15:00:00Z'),
      verifiedById: adminUser.id,
      remarks: 'Storage media sanitization verified prior to physical destruction.',
    },
  });

  console.log('✅ Created 9 wiping records with various lifecycle states.');

  // 6. Create Realistic Disposal Records
  console.log('♻️ Creating disposal records...');

  // Asset 11 (DISPOSED - E-Waste Recycling)
  await prisma.disposalRecord.create({
    data: {
      assetId: createdAssets['AST-2024-011'].id,
      officerId: disposalOfficerUser.id,
      disposalMethod: DisposalMethod.RECYCLING,
      vendorName: 'EcoTech Global Recycling Solutions',
      certificateNumber: 'CERT-REC-2026-8801',
      remarks: 'R2v3 and e-Stewards certified electronics recycling batch #4401.',
      disposedAt: new Date('2026-08-23T11:00:00Z'),
    },
  });

  // Asset 12 (DISPOSED - Physical Shredding)
  await prisma.disposalRecord.create({
    data: {
      assetId: createdAssets['AST-2024-012'].id,
      officerId: disposalOfficerUser.id,
      disposalMethod: DisposalMethod.PHYSICAL_SHREDDING,
      vendorName: 'SecureShred Industrial Destruction Services',
      certificateNumber: 'CERT-SHRED-2026-9402',
      remarks: 'Drives and chassis cross-cut shredded to DIN 66399 Level H-5 particles.',
      disposedAt: new Date('2026-08-24T14:30:00Z'),
    },
  });

  console.log('✅ Created 2 disposal records with unique certificate numbers.');

  console.log('\n🎉 AssetGuard database seeding completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
