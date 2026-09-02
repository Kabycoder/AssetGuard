import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import { JwtPayload } from '../types/auth.types';

async function runAuthTests() {
  console.log('====================================================');
  console.log('       ASSETGUARD - PHASE 3 AUTH & RBAC TESTS       ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`   ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`   ❌ FAIL: ${testName}`);
    }
  }

  // TEST SUITE 1: Password Hashing & Verification
  console.log('1. [BCRYPT PASSWORD HASHING & COMPARISON]');
  const rawPassword = 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(rawPassword, salt);

  const isValidMatch = await bcrypt.compare(rawPassword, hash);
  assert(isValidMatch, 'Valid password matches bcrypt hash');

  const isInvalidMatch = await bcrypt.compare('WrongPassword999!', hash);
  assert(!isInvalidMatch, 'Incorrect password correctly rejected by bcrypt');

  // TEST SUITE 2: JWT Token Generation & Verification
  console.log('\n2. [JWT GENERATION & VERIFICATION]');
  const demoPayload: JwtPayload = {
    userId: '11111111-2222-3333-4444-555555555555',
    email: 'admin@assetguard.local',
    role: Role.ADMIN,
  };

  const token = jwt.sign(demoPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });

  assert(typeof token === 'string' && token.length > 20, 'Signed JWT token generated');

  const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
  assert(decoded.userId === demoPayload.userId, 'Decoded JWT preserves userId');
  assert(decoded.email === demoPayload.email, 'Decoded JWT preserves email');
  assert(decoded.role === Role.ADMIN, 'Decoded JWT preserves Role enum');

  // TEST SUITE 3: authenticateToken Middleware
  console.log('\n3. [AUTHENTICATE TOKEN MIDDLEWARE]');

  // 3a. Missing Header
  let statusResult = 0;
  const mockRes = () => ({
    status: (code: number) => {
      statusResult = code;
      return {
        json: (_data: any) => {},
      };
    },
  });

  let nextCalled = false;
  authenticateToken(
    { headers: {} } as any,
    mockRes() as any,
    () => {
      nextCalled = true;
    }
  );
  assert(statusResult === 401 && !nextCalled, 'Missing Authorization header returns 401 Unauthorized');

  // 3b. Malformed Header
  statusResult = 0;
  nextCalled = false;
  authenticateToken(
    { headers: { authorization: 'Basic 12345' } } as any,
    mockRes() as any,
    () => {
      nextCalled = true;
    }
  );
  assert(statusResult === 401 && !nextCalled, 'Malformed Authorization header returns 401');

  // 3c. Invalid / Corrupt Token
  statusResult = 0;
  nextCalled = false;
  authenticateToken(
    { headers: { authorization: 'Bearer invalid.corrupted.token' } } as any,
    mockRes() as any,
    () => {
      nextCalled = true;
    }
  );
  assert(statusResult === 401 && !nextCalled, 'Corrupted token returns 401');

  // 3d. Valid Token
  statusResult = 0;
  nextCalled = false;
  const validReq: any = { headers: { authorization: `Bearer ${token}` } };
  authenticateToken(validReq, mockRes() as any, () => {
    nextCalled = true;
  });
  assert(nextCalled && validReq.user?.email === 'admin@assetguard.local', 'Valid token calls next() and attaches user payload');

  // TEST SUITE 4: Role-Based Access Control (RBAC) Middleware
  console.log('\n4. [RBAC AUTHORIZATION MIDDLEWARE]');

  const itTokenPayload: JwtPayload = {
    userId: '22222222-3333-4444-5555-666666666666',
    email: 'it@assetguard.local',
    role: Role.IT_OFFICER,
  };

  const disposalTokenPayload: JwtPayload = {
    userId: '33333333-4444-5555-6666-777777777777',
    email: 'disposal@assetguard.local',
    role: Role.DISPOSAL_OFFICER,
  };

  // 4a. ADMIN accesses IT-only route -> Should ALLOW (ADMIN has full access)
  nextCalled = false;
  statusResult = 0;
  const adminReq: any = { user: demoPayload };
  authorizeRoles(Role.IT_OFFICER)(adminReq, mockRes() as any, () => {
    nextCalled = true;
  });
  assert(nextCalled, 'ADMIN has full access to IT Officer routes (200 OK)');

  // 4b. IT_OFFICER accesses IT-only route -> Should ALLOW
  nextCalled = false;
  statusResult = 0;
  const itReq: any = { user: itTokenPayload };
  authorizeRoles(Role.IT_OFFICER)(itReq, mockRes() as any, () => {
    nextCalled = true;
  });
  assert(nextCalled, 'IT_OFFICER accesses IT Officer route (200 OK)');

  // 4c. IT_OFFICER accesses DISPOSAL-only route -> Should FORBID (403)
  nextCalled = false;
  statusResult = 0;
  authorizeRoles(Role.DISPOSAL_OFFICER)(itReq, mockRes() as any, () => {
    nextCalled = true;
  });
  assert(!nextCalled && statusResult === 403, 'IT_OFFICER blocked from Disposal Officer route (403 Forbidden)');

  // 4d. DISPOSAL_OFFICER accesses DISPOSAL-only route -> Should ALLOW
  nextCalled = false;
  statusResult = 0;
  const disposalReq: any = { user: disposalTokenPayload };
  authorizeRoles(Role.DISPOSAL_OFFICER)(disposalReq, mockRes() as any, () => {
    nextCalled = true;
  });
  assert(nextCalled, 'DISPOSAL_OFFICER accesses Disposal Officer route (200 OK)');

  // 4e. DISPOSAL_OFFICER accesses IT-only route -> Should FORBID (403)
  nextCalled = false;
  statusResult = 0;
  authorizeRoles(Role.IT_OFFICER)(disposalReq, mockRes() as any, () => {
    nextCalled = true;
  });
  assert(!nextCalled && statusResult === 403, 'DISPOSAL_OFFICER blocked from IT Officer route (403 Forbidden)');

  console.log('\n====================================================');
  console.log(`       TEST RESULTS: ${passed}/${total} TESTS PASSED`);
  if (passed === total) {
    console.log('       🎉 ALL AUTH & RBAC VALIDATIONS PASSED!');
  } else {
    console.log('       ⚠️ SOME TESTS FAILED');
  }
  console.log('====================================================\n');
}

runAuthTests().catch(console.error);
