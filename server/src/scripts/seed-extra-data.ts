import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/assetguard?directConnection=true';

async function seedExtraData() {
  console.log('Connecting to MongoDB to insert extra enterprise sample data...');
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db('assetguard');

    // Fetch existing users to link records
    const users = await db.collection('users').find({}).toArray();
    const adminUser = users.find((u) => u.role === 'ADMIN') || users[0];
    const itUser = users.find((u) => u.role === 'IT_OFFICER') || users[1] || users[0];
    const disposalUser = users.find((u) => u.role === 'DISPOSAL_OFFICER') || users[2] || users[0];

    const now = new Date();

    console.log('Inserting 8 extra enterprise IT assets...');
    const extraAssets = [
      {
        _id: new ObjectId(),
        assetTag: 'AST-2024-013',
        serialNumber: 'SN-LEN-X1C11-013',
        assetType: 'Laptop',
        brand: 'Lenovo',
        model: 'ThinkPad X1 Carbon Gen 11',
        department: 'Executive Office',
        purchaseDate: new Date('2022-04-10'),
        status: 'REGISTERED',
        createdAt: new Date('2026-09-01T10:00:00Z'),
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetTag: 'AST-2024-014',
        serialNumber: 'SN-DELL-P5820-014',
        assetType: 'Workstation',
        brand: 'Dell',
        model: 'Precision 5820 AI Workstation',
        department: 'Artificial Intelligence',
        purchaseDate: new Date('2021-08-15'),
        status: 'WIPING_PENDING',
        createdAt: new Date('2026-09-02T11:30:00Z'),
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetTag: 'AST-2024-015',
        serialNumber: 'SN-SMC-SYS2029-015',
        assetType: 'Rack Server',
        brand: 'Supermicro',
        model: 'SuperServer 2029U Dual Xeon',
        department: 'Cloud Infrastructure',
        purchaseDate: new Date('2020-03-22'),
        status: 'WIPING_IN_PROGRESS',
        createdAt: new Date('2026-09-03T09:15:00Z'),
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetTag: 'AST-2024-016',
        serialNumber: 'SN-FG-200F-016',
        assetType: 'Firewall Appliance',
        brand: 'Fortinet',
        model: 'FortiGate 200F Next-Gen Firewall',
        department: 'Cybersecurity',
        purchaseDate: new Date('2021-06-18'),
        status: 'WIPING_COMPLETED',
        createdAt: new Date('2026-09-04T14:00:00Z'),
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetTag: 'AST-2024-017',
        serialNumber: 'SN-CISCO-N9K-017',
        assetType: 'Enterprise Switch',
        brand: 'Cisco',
        model: 'Nexus 93180YC-FX Leaf Switch',
        department: 'Data Center Ops',
        purchaseDate: new Date('2020-11-05'),
        status: 'WIPING_COMPLETED',
        createdAt: new Date('2026-09-05T08:45:00Z'),
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetTag: 'AST-2024-018',
        serialNumber: 'SN-HP-ZBF16-018',
        assetType: 'Laptop',
        brand: 'HP',
        model: 'ZBook Fury 16 G10 Mobile Workstation',
        department: 'Product Engineering',
        purchaseDate: new Date('2022-09-12'),
        status: 'VERIFIED',
        createdAt: new Date('2026-09-06T13:20:00Z'),
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetTag: 'AST-2024-019',
        serialNumber: 'SN-NETAPP-A400-019',
        assetType: 'SAN Storage Array',
        brand: 'NetApp',
        model: 'AFF A400 All-Flash NVMe Array',
        department: 'Enterprise Storage',
        purchaseDate: new Date('2019-12-01'),
        status: 'DISPOSED',
        createdAt: new Date('2026-08-15T09:00:00Z'),
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        assetTag: 'AST-2024-020',
        serialNumber: 'SN-APPL-MSM2U-020',
        assetType: 'Workstation',
        brand: 'Apple',
        model: 'Mac Studio M2 Ultra (192GB RAM)',
        department: 'Media & Marketing',
        purchaseDate: new Date('2023-01-20'),
        status: 'DISPOSED',
        createdAt: new Date('2026-08-16T10:30:00Z'),
        updatedAt: now,
      },
    ];

    // Check for existing asset tags to prevent duplicates
    for (const a of extraAssets) {
      const exists = await db.collection('assets').findOne({ assetTag: a.assetTag });
      if (!exists) {
        await db.collection('assets').insertOne(a);
      }
    }
    console.log('✅ Extra assets inserted or verified.');

    // Fetch inserted assets
    const a14 = await db.collection('assets').findOne({ assetTag: 'AST-2024-014' });
    const a15 = await db.collection('assets').findOne({ assetTag: 'AST-2024-015' });
    const a16 = await db.collection('assets').findOne({ assetTag: 'AST-2024-016' });
    const a17 = await db.collection('assets').findOne({ assetTag: 'AST-2024-017' });
    const a18 = await db.collection('assets').findOne({ assetTag: 'AST-2024-018' });
    const a19 = await db.collection('assets').findOne({ assetTag: 'AST-2024-019' });
    const a20 = await db.collection('assets').findOne({ assetTag: 'AST-2024-020' });

    console.log('Inserting corresponding wiping records...');
    const extraWipes = [
      // AST-2024-014 (WIPING_PENDING)
      {
        assetId: a14?._id,
        technicianId: itUser?._id,
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge / Cryptographic Erase)',
        wipingTool: 'Blancco Drive Eraser v8.2',
        status: 'PENDING',
        verificationStatus: 'PENDING',
        remarks: 'NVMe SSD purge scheduled for AI research machine.',
        createdAt: new Date('2026-09-02T12:00:00Z'),
        updatedAt: now,
      },
      // AST-2024-015 (WIPING_IN_PROGRESS)
      {
        assetId: a15?._id,
        technicianId: itUser?._id,
        wipingMethod: 'DoD 5220.22-M 7-Pass (Multi-Pass Overwrite)',
        wipingTool: 'Active@ KillDisk Pro v24.0',
        status: 'IN_PROGRESS',
        verificationStatus: 'PENDING',
        startedAt: new Date(Date.now() - 5400000), // 1.5 hrs ago
        remarks: 'Pass 4 of 7 in progress across 12 drive bays.',
        createdAt: new Date('2026-09-03T10:00:00Z'),
        updatedAt: now,
      },
      // AST-2024-016 (WIPING_COMPLETED - Awaiting Admin Verification)
      {
        assetId: a16?._id,
        technicianId: itUser?._id,
        wipingMethod: 'Cryptographic Factory Reset & NVRAM Overwrite',
        wipingTool: 'FortiOS Maintenance Zeroizer CLI',
        status: 'COMPLETED',
        verificationStatus: 'PENDING',
        startedAt: new Date('2026-09-04T15:00:00Z'),
        completedAt: new Date('2026-09-04T17:15:00Z'),
        remarks: 'All VPN certificates, pre-shared keys, and logs erased. Ready for admin audit.',
        createdAt: new Date('2026-09-04T15:00:00Z'),
        updatedAt: now,
      },
      // AST-2024-017 (WIPING_COMPLETED - Awaiting Admin Verification)
      {
        assetId: a17?._id,
        technicianId: itUser?._id,
        wipingMethod: 'NIST SP 800-88 Rev 1 (Clear / 1-Pass Zero Fill)',
        wipingTool: 'Cisco NX-OS Secure Erase',
        status: 'COMPLETED',
        verificationStatus: 'PENDING',
        startedAt: new Date('2026-09-05T09:30:00Z'),
        completedAt: new Date('2026-09-05T11:45:00Z'),
        remarks: 'Zero-filled bootflash and NVRAM. Sector checksum 0x00 verified.',
        createdAt: new Date('2026-09-05T09:30:00Z'),
        updatedAt: now,
      },
      // AST-2024-018 (VERIFIED)
      {
        assetId: a18?._id,
        technicianId: itUser?._id,
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge / Cryptographic Erase)',
        wipingTool: 'Blancco Drive Eraser v8.2',
        status: 'COMPLETED',
        verificationStatus: 'VERIFIED',
        startedAt: new Date('2026-09-06T14:00:00Z'),
        completedAt: new Date('2026-09-06T16:30:00Z'),
        verifiedAt: new Date('2026-09-06T18:00:00Z'),
        verifiedById: adminUser?._id,
        remarks: 'Dual 2TB NVMe drives verified sanitized. Ready for disposal.',
        createdAt: new Date('2026-09-06T14:00:00Z'),
        updatedAt: now,
      },
      // AST-2024-019 (DISPOSED)
      {
        assetId: a19?._id,
        technicianId: itUser?._id,
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge / NVMe Sanitize)',
        wipingTool: 'NetApp ONTAP Disk Wipe Engine',
        status: 'COMPLETED',
        verificationStatus: 'VERIFIED',
        startedAt: new Date('2026-08-15T10:00:00Z'),
        completedAt: new Date('2026-08-15T20:00:00Z'),
        verifiedAt: new Date('2026-08-16T09:00:00Z'),
        verifiedById: adminUser?._id,
        remarks: '24-drive NVMe storage tier wiped and certified.',
        createdAt: new Date('2026-08-15T10:00:00Z'),
        updatedAt: now,
      },
      // AST-2024-020 (DISPOSED)
      {
        assetId: a20?._id,
        technicianId: itUser?._id,
        wipingMethod: 'Apple T2 / Secure Enclave Cryptographic Erasure',
        wipingTool: 'Apple Configurator 2 Restore & DFU Wipe',
        status: 'COMPLETED',
        verificationStatus: 'VERIFIED',
        startedAt: new Date('2026-08-16T11:00:00Z'),
        completedAt: new Date('2026-08-16T13:00:00Z'),
        verifiedAt: new Date('2026-08-16T14:30:00Z'),
        verifiedById: adminUser?._id,
        remarks: 'Hardware encryption keys zeroized and restored to factory image.',
        createdAt: new Date('2026-08-16T11:00:00Z'),
        updatedAt: now,
      },
    ];

    for (const w of extraWipes) {
      if (w.assetId) {
        const exists = await db.collection('wiping_records').findOne({ assetId: w.assetId });
        if (!exists) {
          await db.collection('wiping_records').insertOne({ _id: new ObjectId(), ...w });
        }
      }
    }
    console.log('✅ Extra wiping records inserted or verified.');

    console.log('Inserting corresponding disposal records...');
    const extraDisposals = [
      // AST-2024-019 (DISPOSED - R2 Recycling)
      {
        assetId: a19?._id,
        officerId: disposalUser?._id,
        disposalMethod: 'RECYCLING',
        vendorName: 'SIMS Lifecycle Global Services (R2v3 Certified)',
        certificateNumber: 'CERT-REC-2026-9903',
        remarks: '48U rack disassembled. Non-ferrous metals and precious components recycled per ISO 14001.',
        disposedAt: new Date('2026-08-18T11:00:00Z'),
        createdAt: new Date('2026-08-18T11:00:00Z'),
        updatedAt: now,
      },
      // AST-2024-020 (DISPOSED - Physical Shredding)
      {
        assetId: a20?._id,
        officerId: disposalUser?._id,
        disposalMethod: 'PHYSICAL_SHREDDING',
        vendorName: 'Iron Mountain Secure Destruction',
        certificateNumber: 'CERT-SHRED-2026-9904',
        remarks: 'Solid-state drive flash chips mechanically granulated to DIN 66399 Level E-4 standards.',
        disposedAt: new Date('2026-08-19T14:15:00Z'),
        createdAt: new Date('2026-08-19T14:15:00Z'),
        updatedAt: now,
      },
    ];

    for (const d of extraDisposals) {
      if (d.assetId) {
        const exists = await db.collection('disposal_records').findOne({ certificateNumber: d.certificateNumber });
        if (!exists) {
          await db.collection('disposal_records').insertOne({ _id: new ObjectId(), ...d });
        }
      }
    }
    console.log('✅ Extra disposal records inserted or verified.');

    console.log('\n🎉 Extra sample dataset successfully added to MongoDB!\n');
  } catch (error) {
    console.error('❌ Error seeding extra data:', error);
  } finally {
    await client.close();
  }
}

seedExtraData();
