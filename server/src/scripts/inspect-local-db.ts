import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function inspectLocalDb() {
  const localUri =
    process.env.DATABASE_URL ||
    'mongodb://localhost:27017/assetguard?directConnection=true&serverSelectionTimeoutMS=3000';

  console.log('--- LOCAL MONGODB INSPECTION ---');
  console.log('Connection URI:', localUri.replace(/:[^:@]*@/, ':****@'));

  const client = new MongoClient(localUri);

  try {
    await client.connect();
    console.log('✅ Connection to local MongoDB established successfully.');

    const db = client.db('assetguard');
    const collections = await db.listCollections().toArray();

    console.log(`\nFound ${collections.length} collections in 'assetguard' database:`);

    const summary: Record<string, any> = {};

    for (const col of collections) {
      const name = col.name;
      const count = await db.collection(name).countDocuments();
      summary[name] = { count };

      const samples = await db.collection(name).find({}).limit(2).toArray();
      const sanitizedSamples = samples.map((doc: any) => {
        const copy = { ...doc };
        if (copy.passwordHash) copy.passwordHash = '[PROTECTED_HASH]';
        return copy;
      });
      summary[name].samples = sanitizedSamples;

      console.log(`- ${name}: ${count} document(s)`);
    }

    console.log('\n--- COLLECTION DETAILS ---');
    console.log(JSON.stringify(summary, null, 2));

  } catch (error: any) {
    console.error('❌ Failed to connect to local MongoDB:', error.message);
  } finally {
    await client.close();
    console.log('\n--- INSPECTION COMPLETE ---');
  }
}

inspectLocalDb();
