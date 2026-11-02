import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Diagnostic Verification Script for Prisma on MongoDB Atlas
 */
export async function verifyAtlas(atlasUri?: string) {
  const connectionUrl = atlasUri || process.env.ATLAS_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionUrl) {
    throw new Error('No DATABASE_URL or ATLAS_DATABASE_URL provided.');
  }

  console.log('====================================================');
  console.log('          PRISMA MONGODB ATLAS VERIFICATION         ');
  console.log('====================================================');
  console.log('Target URI:', connectionUrl.replace(/:[^:@]*@/, ':****@'));

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  });

  try {
    console.log('\n1. Testing raw connection to MongoDB Atlas...');
    await prisma.$connect();
    console.log('✅ Prisma connected to MongoDB Atlas successfully!');

    console.log('\n2. Verifying collections and records via Prisma ORM:');
    const userCount = await prisma.user.count();
    const assetCount = await prisma.asset.count();
    const wipingCount = await prisma.wipingRecord.count();
    const disposalCount = await prisma.disposalRecord.count();

    console.log(`- Users:            ${userCount}`);
    console.log(`- Assets:           ${assetCount}`);
    console.log(`- Wiping Records:   ${wipingCount}`);
    console.log(`- Disposal Records: ${disposalCount}`);

    console.log('\n3. Testing enterprise account access:');
    const admin = await prisma.user.findUnique({
      where: { email: 'ms.kabi78@gmail.com' },
      select: { id: true, name: true, email: true, role: true },
    });

    if (admin) {
      console.log(`✅ Admin account found: ${admin.name} (${admin.email}, Role: ${admin.role})`);
    } else {
      console.warn('⚠️ Admin account ms.kabi78@gmail.com not found yet in this database.');
    }

    console.log('\n4. Testing asset query with relationship joins:');
    const sampleAsset = await prisma.asset.findFirst({
      include: {
        wipingRecords: true,
        disposalRecords: true,
      },
    });

    if (sampleAsset) {
      console.log(
        `✅ Sample Asset fetched: ${sampleAsset.assetTag} (${sampleAsset.brand} ${sampleAsset.model}, Status: ${sampleAsset.status})`
      );
      console.log(`   - Attached Wiping Records: ${sampleAsset.wipingRecords.length}`);
      console.log(`   - Attached Disposal Records: ${sampleAsset.disposalRecords.length}`);
    }

    console.log('\n====================================================');
    console.log('🎉 ATLAS PRODUCTION DATABASE VERIFICATION SUCCESSFUL!');
    console.log('====================================================');

    return {
      success: true,
      counts: { userCount, assetCount, wipingCount, disposalCount },
    };
  } catch (error: any) {
    console.error('\n❌ Prisma Atlas verification failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  const uri = process.argv[2];
  verifyAtlas(uri)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
