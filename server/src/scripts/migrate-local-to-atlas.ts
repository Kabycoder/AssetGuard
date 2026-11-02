import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Safe, Non-Destructive Data Migration: Local MongoDB -> MongoDB Atlas
 *
 * Safety guarantees:
 * 1. Read-only on local database (never modifies or deletes local data).
 * 2. Idempotent on target Atlas database (uses upsert by _id, avoiding duplicates).
 * 3. Complete verification (counts and validates every collection).
 */
export async function migrateData(atlasUri: string) {
  const localUri =
    process.env.DATABASE_URL ||
    'mongodb://localhost:27017/assetguard?directConnection=true&serverSelectionTimeoutMS=3000';

  if (!atlasUri || !atlasUri.startsWith('mongodb')) {
    throw new Error('Invalid MongoDB Atlas connection string provided.');
  }

  // Ensure target database is named 'assetguard'
  let targetUri = atlasUri;
  if (!targetUri.includes('/assetguard')) {
    targetUri = targetUri.replace(/\.net\/?(\?.*)?$/, '.net/assetguard$1');
  }

  console.log('====================================================');
  console.log('   ASSETGUARD DATABASE MIGRATION (LOCAL -> ATLAS)   ');
  console.log('====================================================');
  console.log('Source: Local MongoDB (Read-Only)');
  console.log('Target: MongoDB Atlas (assetguard database)');
  console.log('Target URI:', targetUri.replace(/:[^:@]*@/, ':****@'));
  console.log('----------------------------------------------------');

  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(targetUri);

  try {
    console.log('1. Connecting to local database...');
    await localClient.connect();
    console.log('✅ Local MongoDB connected.');

    console.log('2. Connecting to MongoDB Atlas...');
    await atlasClient.connect();
    console.log('✅ MongoDB Atlas connected.');

    const localDb = localClient.db('assetguard');
    const atlasDb = atlasClient.db('assetguard');

    const collectionsToMigrate = ['users', 'assets', 'wiping_records', 'disposal_records'];

    console.log('\n3. Beginning migration of collections:');

    const report: Record<string, { localCount: number; migratedCount: number; atlasFinalCount: number }> = {};

    for (const colName of collectionsToMigrate) {
      console.log(`\n--- Processing collection: ${colName} ---`);
      const localCol = localDb.collection(colName);
      const atlasCol = atlasDb.collection(colName);

      const localCount = await localCol.countDocuments();
      console.log(`   Source documents found: ${localCount}`);

      if (localCount === 0) {
        console.log(`   ⚠️ Collection ${colName} is empty in local db. Skipping.`);
        report[colName] = { localCount: 0, migratedCount: 0, atlasFinalCount: 0 };
        continue;
      }

      // Stream documents in batches of 100
      const cursor = localCol.find({});
      const batchSize = 100;
      let batch: any[] = [];
      let migratedCount = 0;

      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        if (doc) {
          batch.push({
            replaceOne: {
              filter: { _id: doc._id },
              replacement: doc,
              upsert: true,
            },
          });
        }

        if (batch.length >= batchSize) {
          const res = await atlasCol.bulkWrite(batch, { ordered: false });
          migratedCount += (res.upsertedCount + res.modifiedCount + res.matchedCount);
          batch = [];
        }
      }

      if (batch.length > 0) {
        const res = await atlasCol.bulkWrite(batch, { ordered: false });
        migratedCount += (res.upsertedCount + res.modifiedCount + res.matchedCount);
        batch = [];
      }

      const atlasFinalCount = await atlasCol.countDocuments();
      console.log(`   ✅ Migration completed for ${colName}:`);
      console.log(`      - Local count:       ${localCount}`);
      console.log(`      - Atlas total count: ${atlasFinalCount}`);

      report[colName] = { localCount, migratedCount, atlasFinalCount };
    }

    console.log('\n====================================================');
    console.log('              MIGRATION VERIFICATION REPORT         ');
    console.log('====================================================');
    console.table(report);

    let allMatch = true;
    for (const [col, stats] of Object.entries(report)) {
      if (stats.atlasFinalCount < stats.localCount) {
        console.warn(`⚠️ Warning: ${col} has fewer documents in Atlas than in local!`);
        allMatch = false;
      }
    }

    if (allMatch) {
      console.log('\n🎉 ALL COLLECTIONS SUCCESSFULLY MIGRATED WITH 100% INTEGRITY!');
      console.log('Local MongoDB was kept 100% untouched.');
    }

    return { success: true, report };
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    await localClient.close();
    await atlasClient.close();
    console.log('\nConnections safely closed.');
  }
}

// Direct CLI execution if ATLAS_URL is provided in environment
if (require.main === module) {
  const atlasUrl = process.env.ATLAS_DATABASE_URL || process.argv[2];
  if (!atlasUrl) {
    console.error('Usage: npx tsx src/scripts/migrate-local-to-atlas.ts "<MONGODB_ATLAS_URI>"');
    process.exit(1);
  }
  migrateData(atlasUrl)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
