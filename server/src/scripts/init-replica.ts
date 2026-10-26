import { PrismaClient } from '@prisma/client';

async function init() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'mongodb://127.0.0.1:27017/admin?directConnection=true',
      },
    },
  });

  try {
    console.log('Connecting to MongoDB on 127.0.0.1:27017 to initiate replica set...');
    const result = await prisma.$runCommandRaw({ replSetInitiate: {} });
    console.log('✅ Replica set rs0 initiated successfully!', JSON.stringify(result));
  } catch (error: any) {
    if (error.message?.includes('already initialized')) {
      console.log('✅ Replica set rs0 is already initialized.');
    } else {
      console.error('Notice:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

init();
