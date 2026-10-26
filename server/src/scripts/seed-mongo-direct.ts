import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/assetguard?directConnection=true';

async function seedDirect() {
  console.log('Connecting directly to MongoDB via native driver...');
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB successfully!');
    const db = client.db('assetguard');

    console.log('Cleaning existing records in collections...');
    await db.collection('disposal_records').deleteMany({});
    await db.collection('wiping_records').deleteMany({});
    await db.collection('assets').deleteMany({});
    await db.collection('users').deleteMany({});

    console.log('Hashing passwords...');
    const saltRounds = 10;
    const adminPasswordHash = await bcrypt.hash('Admin@Kabi2026!', saltRounds);
    const itPasswordHash = await bcrypt.hash('IT@Jeya2026!', saltRounds);
    const disposalPasswordHash = await bcrypt.hash('Disposal@Broo2026!', saltRounds);
    const defaultPasswordHash = await bcrypt.hash('Password123!', saltRounds);

    console.log('Inserting authorized users...');
    const now = new Date();

    const primaryAdminId = new ObjectId();
    const primaryItId = new ObjectId();
    const primaryDisposalId = new ObjectId();

    const testAdminId = new ObjectId();
    const testItId = new ObjectId();
    const testDisposalId = new ObjectId();

    const users = [
      {
        _id: primaryAdminId,
        name: 'Kabilashini (Admin)',
        email: 'ms.kabi78@gmail.com',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: primaryItId,
        name: 'Jeyarajalingam (IT Officer)',
        email: 'jeyarajalingam0@gmail.com',
        passwordHash: itPasswordHash,
        role: 'IT_OFFICER',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: primaryDisposalId,
        name: 'Disposal Officer',
        email: 'itzmebroo1@gmail.com',
        passwordHash: disposalPasswordHash,
        role: 'DISPOSAL_OFFICER',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: testAdminId,
        name: 'Sarah Jenkins',
        email: 'admin@assetguard.local',
        passwordHash: defaultPasswordHash,
        role: 'ADMIN',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: testItId,
        name: 'Alex Rivera',
        email: 'it@assetguard.local',
        passwordHash: defaultPasswordHash,
        role: 'IT_OFFICER',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: testDisposalId,
        name: 'Marcus Chen',
        email: 'disposal@assetguard.local',
        passwordHash: defaultPasswordHash,
        role: 'DISPOSAL_OFFICER',
        createdAt: now,
        updatedAt: now,
      },
    ];

    await db.collection('users').insertMany(users);
    console.log(`✅ Seeded ${users.length} users into users collection.`);

    console.log('Inserting enterprise IT assets...');
    const assetDefinitions = [
      {
        assetTag: 'AST-2024-001',
        serialNumber: 'SN-DELL-LAT7420-001',
        assetType: 'Laptop',
        brand: 'Dell',
        model: 'Latitude 7420 vPro',
        department: 'Engineering',
        purchaseDate: new Date('2021-03-15'),
        status: 'REGISTERED',
      },
      {
        assetTag: 'AST-2024-002',
        serialNumber: 'SN-APPL-MBP16-002',
        assetType: 'Laptop',
        brand: 'Apple',
        model: 'MacBook Pro 16" M1 Max',
        department: 'Product Design',
        purchaseDate: new Date('2021-11-10'),
        status: 'REGISTERED',
      },
      {
        assetTag: 'AST-2024-003',
        serialNumber: 'SN-LEN-T14-003',
        assetType: 'Laptop',
        brand: 'Lenovo',
        model: 'ThinkPad T14 Gen 2',
        department: 'Human Resources',
        purchaseDate: new Date('2020-08-20'),
        status: 'WIPING_PENDING',
      },
      {
        assetTag: 'AST-2024-004',
        serialNumber: 'SN-HP-EB840-004',
        assetType: 'Laptop',
        brand: 'HP',
        model: 'EliteBook 840 G8',
        department: 'Finance',
        purchaseDate: new Date('2021-01-18'),
        status: 'WIPING_PENDING',
      },
      {
        assetTag: 'AST-2024-005',
        serialNumber: 'SN-DELL-PWS7820-005',
        assetType: 'Workstation',
        brand: 'Dell',
        model: 'Precision 7820 Tower Workstation',
        department: 'Data Science',
        purchaseDate: new Date('2019-06-12'),
        status: 'WIPING_IN_PROGRESS',
      },
      {
        assetTag: 'AST-2024-006',
        serialNumber: 'SN-HP-Z4G4-006',
        assetType: 'Workstation',
        brand: 'HP',
        model: 'Z4 G4 Workstation Xeon',
        department: 'Engineering',
        purchaseDate: new Date('2019-09-05'),
        status: 'WIPING_IN_PROGRESS',
      },
      {
        assetTag: 'AST-2024-007',
        serialNumber: 'SN-DELL-R740-007',
        assetType: 'Rack Server',
        brand: 'Dell',
        model: 'PowerEdge R740 2U Server',
        department: 'Infrastructure & Ops',
        purchaseDate: new Date('2018-05-22'),
        status: 'WIPING_COMPLETED',
      },
      {
        assetTag: 'AST-2024-008',
        serialNumber: 'SN-HPE-DL380-008',
        assetType: 'Rack Server',
        brand: 'HPE',
        model: 'ProLiant DL380 Gen10',
        department: 'Infrastructure & Ops',
        purchaseDate: new Date('2018-10-14'),
        status: 'WIPING_COMPLETED',
      },
      {
        assetTag: 'AST-2024-009',
        serialNumber: 'SN-CISCO-C9300-009',
        assetType: 'Enterprise Switch',
        brand: 'Cisco',
        model: 'Catalyst 9300 48-Port PoE+',
        department: 'Network Operations',
        purchaseDate: new Date('2019-02-11'),
        status: 'VERIFIED',
      },
      {
        assetTag: 'AST-2024-010',
        serialNumber: 'SN-PAN-PA3220-010',
        assetType: 'Firewall Appliance',
        brand: 'Palo Alto Networks',
        model: 'PA-3220 Next-Gen Firewall',
        department: 'Information Security',
        purchaseDate: new Date('2019-07-29'),
        status: 'VERIFIED',
      },
      {
        assetTag: 'AST-2024-011',
        serialNumber: 'SN-DELL-EMC-ME4024-011',
        assetType: 'SAN Storage Array',
        brand: 'Dell EMC',
        model: 'PowerVault ME4024 Storage',
        department: 'Enterprise Storage',
        purchaseDate: new Date('2017-12-04'),
        status: 'DISPOSED',
      },
      {
        assetTag: 'AST-2024-012',
        serialNumber: 'SN-LEN-SR650-012',
        assetType: 'Rack Server',
        brand: 'Lenovo',
        model: 'ThinkSystem SR650 2U',
        department: 'Infrastructure & Ops',
        purchaseDate: new Date('2018-04-16'),
        status: 'DISPOSED',
      },
    ];

    const assetIdMap: Record<string, ObjectId> = {};
    const assetsToInsert = assetDefinitions.map((item) => {
      const _id = new ObjectId();
      assetIdMap[item.assetTag] = _id;
      return {
        _id,
        ...item,
        createdAt: now,
        updatedAt: now,
      };
    });

    await db.collection('assets').insertMany(assetsToInsert);
    console.log(`✅ Seeded ${assetsToInsert.length} assets into assets collection.`);

    console.log('Inserting wiping records...');
    const wipingRecords = [
      {
        _id: new ObjectId(),
        assetId: assetIdMap['AST-2024-003'],
        technicianId: testItId,
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge / Cryptographic Erase)',
        wipingTool: 'Blancco Drive Eraser v7.8',
        status: 'PENDING',
        verificationStatus: 'PENDING',
        remarks: 'Scheduled for cryptographic erase after decommissioning.',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetId: assetIdMap['AST-2024-005'],
        technicianId: testItId,
        wipingMethod: 'DoD 5220.22-M (3-Pass Overwrite with Pattern Verification)',
        wipingTool: 'nwipe v0.34 CLI engine',
        status: 'IN_PROGRESS',
        verificationStatus: 'PENDING',
        startedAt: new Date(Date.now() - 3600000 * 2),
        remarks: 'Pass 2 of 3 currently in progress (67% complete).',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetId: assetIdMap['AST-2024-006'],
        technicianId: testItId,
        wipingMethod: 'NIST SP 800-88 Rev 1 (Clear / 1-Pass Zero Fill)',
        wipingTool: 'DBAN v2.3.0 DoD Kernel',
        status: 'IN_PROGRESS',
        verificationStatus: 'PENDING',
        startedAt: new Date(Date.now() - 1800000),
        remarks: 'Fast NVMe drive zeroing initiated on test bench B.',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetId: assetIdMap['AST-2024-007'],
        technicianId: testItId,
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge / Block Erase)',
        wipingTool: 'Blancco Enterprise Data Eraser v8.2',
        status: 'COMPLETED',
        verificationStatus: 'PENDING',
        startedAt: new Date('2026-08-28T09:00:00Z'),
        completedAt: new Date('2026-08-28T14:30:00Z'),
        remarks: 'All 8 SAS drives successfully purged. Checksum verification passed.',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetId: assetIdMap['AST-2024-008'],
        technicianId: testItId,
        wipingMethod: 'DoD 5220.22-M 7-Pass (Enhanced Sanitization)',
        wipingTool: 'Active@ KillDisk Pro v24.0',
        status: 'COMPLETED',
        verificationStatus: 'PENDING',
        startedAt: new Date('2026-08-29T08:15:00Z'),
        completedAt: new Date('2026-08-29T16:45:00Z'),
        remarks: 'Re-wiping completed after previous sector read warning.',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetId: assetIdMap['AST-2024-009'],
        technicianId: testItId,
        wipingMethod: 'NVRAM Flash Sanitization & Factory Reset',
        wipingTool: 'Cisco IOS Secure Erase Engine',
        status: 'COMPLETED',
        verificationStatus: 'VERIFIED',
        startedAt: new Date('2026-08-25T10:00:00Z'),
        completedAt: new Date('2026-08-25T11:15:00Z'),
        verifiedAt: new Date('2026-08-25T14:00:00Z'),
        verifiedById: testAdminId,
        remarks: 'All running-config, VLAN dat, and private crypto keys erased.',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetId: assetIdMap['AST-2024-010'],
        technicianId: testItId,
        wipingMethod: 'PanOS Maintenance Erase / FIPS Zeroization',
        wipingTool: 'Palo Alto Maintenance Mode Zeroizer',
        status: 'COMPLETED',
        verificationStatus: 'VERIFIED',
        startedAt: new Date('2026-08-26T13:00:00Z'),
        completedAt: new Date('2026-08-26T14:45:00Z'),
        verifiedAt: new Date('2026-08-26T17:30:00Z'),
        verifiedById: testAdminId,
        remarks: 'Master key and root partition zeroized per NIST guidelines.',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetId: assetIdMap['AST-2024-011'],
        technicianId: testItId,
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge / Cryptographic Erase)',
        wipingTool: 'Dell Storage Center CLI Wipe',
        status: 'COMPLETED',
        verificationStatus: 'VERIFIED',
        startedAt: new Date('2026-08-20T08:00:00Z'),
        completedAt: new Date('2026-08-20T18:00:00Z'),
        verifiedAt: new Date('2026-08-21T09:30:00Z'),
        verifiedById: testAdminId,
        remarks: 'Array decommission complete. All 24 SSD/HDD bays sanitized.',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetId: assetIdMap['AST-2024-012'],
        technicianId: testItId,
        wipingMethod: 'DoD 5220.22-M 3-Pass',
        wipingTool: 'Blancco Drive Eraser v7.8',
        status: 'COMPLETED',
        verificationStatus: 'VERIFIED',
        startedAt: new Date('2026-08-22T09:00:00Z'),
        completedAt: new Date('2026-08-22T13:30:00Z'),
        verifiedAt: new Date('2026-08-22T15:00:00Z'),
        verifiedById: testAdminId,
        remarks: 'Storage media sanitization verified prior to physical destruction.',
        createdAt: now,
        updatedAt: now,
      },
    ];

    await db.collection('wiping_records').insertMany(wipingRecords);
    console.log(`✅ Seeded ${wipingRecords.length} records into wiping_records collection.`);

    console.log('Inserting disposal records...');
    const disposalRecords = [
      {
        _id: new ObjectId(),
        assetId: assetIdMap['AST-2024-011'],
        officerId: testDisposalId,
        disposalMethod: 'RECYCLING',
        vendorName: 'EcoTech Global Recycling Solutions',
        certificateNumber: 'CERT-REC-2026-8801',
        remarks: 'R2v3 and e-Stewards certified electronics recycling batch #4401.',
        disposedAt: new Date('2026-08-23T11:00:00Z'),
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetId: assetIdMap['AST-2024-012'],
        officerId: testDisposalId,
        disposalMethod: 'PHYSICAL_SHREDDING',
        vendorName: 'SecureShred Industrial Destruction Services',
        certificateNumber: 'CERT-SHRED-2026-9402',
        remarks: 'Drives and chassis cross-cut shredded to DIN 66399 Level H-5 particles.',
        disposedAt: new Date('2026-08-24T14:30:00Z'),
        createdAt: now,
        updatedAt: now,
      },
    ];

    await db.collection('disposal_records').insertMany(disposalRecords);
    console.log(`✅ Seeded ${disposalRecords.length} records into disposal_records collection.`);

    console.log('\n🎉 ALL COLLECTIONS IN MONGODB COMPASS ARE NOW POPULATED!\n');
  } catch (error) {
    console.error('❌ Error during direct MongoDB seed:', error);
  } finally {
    await client.close();
  }
}

seedDirect();
