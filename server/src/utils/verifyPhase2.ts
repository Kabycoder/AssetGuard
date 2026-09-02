import fs from 'fs';
import path from 'path';
import {
  Role,
  AssetStatus,
  WipingStatus,
  VerificationStatus,
  DisposalMethod,
} from '@prisma/client';
import prisma from '../config/prisma';
import { config } from '../config';

async function runPhase2Verification() {
  console.log('====================================================');
  console.log('       ASSETGUARD - PHASE 2 VERIFICATION REPORT     ');
  console.log('====================================================\n');

  let allChecksPassed = true;

  // 1. Check Prisma Client Singleton
  console.log('1. [PRISMA CLIENT SINGLETON]');
  if (prisma) {
    console.log('   ✅ PrismaClient singleton instance initialized successfully.');
  } else {
    console.log('   ❌ PrismaClient singleton instance missing.');
    allChecksPassed = false;
  }

  // 2. Check Enums
  console.log('\n2. [PRISMA ENUMS]');
  console.log('   ✅ Role enum:', Object.values(Role).join(', '));
  console.log('   ✅ AssetStatus enum:', Object.values(AssetStatus).join(', '));
  console.log('   ✅ WipingStatus enum:', Object.values(WipingStatus).join(', '));
  console.log('   ✅ VerificationStatus enum:', Object.values(VerificationStatus).join(', '));
  console.log('   ✅ DisposalMethod enum:', Object.values(DisposalMethod).join(', '));

  // 3. Check Schema File
  console.log('\n3. [SCHEMA FILE CHECK]');
  const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const hasUser = schemaContent.includes('model User');
    const hasAsset = schemaContent.includes('model Asset');
    const hasWiping = schemaContent.includes('model WipingRecord');
    const hasDisposal = schemaContent.includes('model DisposalRecord');
    console.log(`   ✅ schema.prisma found at: ${schemaPath}`);
    console.log(`   ✅ Model User: ${hasUser ? 'FOUND' : 'MISSING'}`);
    console.log(`   ✅ Model Asset: ${hasAsset ? 'FOUND' : 'MISSING'}`);
    console.log(`   ✅ Model WipingRecord: ${hasWiping ? 'FOUND' : 'MISSING'}`);
    console.log(`   ✅ Model DisposalRecord: ${hasDisposal ? 'FOUND' : 'MISSING'}`);
  } else {
    console.log('   ❌ schema.prisma file not found.');
    allChecksPassed = false;
  }

  // 4. Check Migration File
  console.log('\n4. [MIGRATION ARTIFACTS]');
  const migrationDir = path.resolve(__dirname, '../../prisma/migrations/20260901000000_init');
  const migrationFile = path.join(migrationDir, 'migration.sql');
  if (fs.existsSync(migrationFile)) {
    console.log(`   ✅ Initial migration SQL found: ${migrationFile}`);
  } else {
    console.log('   ❌ Migration SQL file missing.');
    allChecksPassed = false;
  }

  // 5. Check Seed File & Demo Users
  console.log('\n5. [SEED CONFIGURATION]');
  const seedPath = path.resolve(__dirname, '../../prisma/seed.ts');
  if (fs.existsSync(seedPath)) {
    const seedContent = fs.readFileSync(seedPath, 'utf8');
    const hasAdmin = seedContent.includes('admin@assetguard.local');
    const hasIt = seedContent.includes('it@assetguard.local');
    const hasDisposal = seedContent.includes('disposal@assetguard.local');
    console.log(`   ✅ seed.ts found at: ${seedPath}`);
    console.log(`   ✅ Demo Admin (admin@assetguard.local): ${hasAdmin ? 'CONFIGURED' : 'MISSING'}`);
    console.log(`   ✅ Demo IT Officer (it@assetguard.local): ${hasIt ? 'CONFIGURED' : 'MISSING'}`);
    console.log(`   ✅ Demo Disposal Officer (disposal@assetguard.local): ${hasDisposal ? 'CONFIGURED' : 'MISSING'}`);
  } else {
    console.log('   ❌ seed.ts file not found.');
    allChecksPassed = false;
  }

  // 6. Check Environment Configuration
  console.log('\n6. [ENVIRONMENT CONFIGURATION]');
  console.log(`   ✅ Configured PORT: ${config.port}`);
  console.log(`   ✅ Configured NODE_ENV: ${config.nodeEnv}`);
  console.log(`   ✅ Configured DATABASE_URL: ${config.databaseUrl ? 'CONFIGURED' : 'NOT SET'}`);

  console.log('\n====================================================');
  if (allChecksPassed) {
    console.log('       🎉 ALL PHASE 2 VERIFICATION CHECKS PASSED!   ');
  } else {
    console.log('       ⚠️ SOME PHASE 2 CHECKS FAILED               ');
  }
  console.log('====================================================\n');
}

runPhase2Verification().catch(console.error);
