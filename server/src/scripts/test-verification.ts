import { createApp } from '../app';
import jwt from 'jsonwebtoken';
import { Role, AssetStatus, VerificationStatus } from '@prisma/client';
import { config } from '../config';
import { closeRedis } from '../config/redis';
import http from 'http';

function generateToken(userId: string, email: string, role: Role): string {
  return jwt.sign({ userId, email, role }, config.jwtSecret, { expiresIn: '1h' });
}

const adminToken = generateToken(
  'a1b2c3d4e5f64a1b8c2d3e4f',
  'admin@assetguard.local',
  Role.ADMIN
);
const itOfficerToken = generateToken(
  'b2c3d4e5f6a14b2c9d3e4f5a',
  'it@assetguard.local',
  Role.IT_OFFICER
);
const disposalOfficerToken = generateToken(
  'c3d4e5f6a1b24c3dae4f5a6b',
  'disposal@assetguard.local',
  Role.DISPOSAL_OFFICER
);

async function request(
  serverPort: number,
  method: string,
  path: string,
  token?: string,
  body?: any
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      headers['Content-Length'] = String(Buffer.byteLength(dataString));
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: serverPort,
        path,
        method,
        headers,
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          let parsedData: any;
          try {
            parsedData = JSON.parse(responseData);
          } catch {
            parsedData = responseData;
          }
          resolve({
            status: res.statusCode || 500,
            data: parsedData,
            headers: res.headers,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(dataString);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Phase 6 Admin Verification Workflow Automated Test Suite...\n');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const address = server.address() as any;
  const port = address.port;
  console.log(`🚀 Test server listening on port ${port}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Unauthenticated request is rejected (401)
    console.log('--- Test Group 1: Authentication & Authorization (RBAC) ---');
    const res1 = await request(port, 'GET', '/api/v1/verification');
    assert(
      res1.status === 401,
      'Test 1: Unauthenticated request to GET /api/v1/verification is rejected with 401'
    );

    // 2. ADMIN can view verification queue
    const res2 = await request(port, 'GET', '/api/v1/verification', adminToken);
    assert(
      res2.status === 200 && res2.data.success === true,
      'Test 2: ADMIN can view verification queue (200 OK)'
    );

    // 3. IT_OFFICER can view verification queue
    const res3 = await request(port, 'GET', '/api/v1/verification', itOfficerToken);
    assert(
      res3.status === 200 &&
        res3.data.success === true &&
        Array.isArray(res3.data.data.assets),
      'Test 3: IT_OFFICER can view verification queue (200 OK)'
    );

    // 4. Role restrictions on verification mutations
    console.log('\n--- Test Group 2: Mutation Role Restrictions ---');
    const targetAssetId = '66e100000000000000000007'; // AST-2024-007 (WIPING_COMPLETED)

    // IT_OFFICER cannot verify or reject
    const res4a = await request(
      port,
      'POST',
      `/api/v1/verification/${targetAssetId}/verify`,
      itOfficerToken
    );
    assert(
      res4a.status === 403,
      'Test 4a: IT_OFFICER cannot verify asset (403 Forbidden)'
    );

    const res4b = await request(
      port,
      'POST',
      `/api/v1/verification/${targetAssetId}/reject`,
      itOfficerToken,
      { rejectionReason: 'Test' }
    );
    assert(
      res4b.status === 403,
      'Test 4b: IT_OFFICER cannot reject asset verification (403 Forbidden)'
    );

    // DISPOSAL_OFFICER cannot verify or reject
    const res4c = await request(
      port,
      'POST',
      `/api/v1/verification/${targetAssetId}/verify`,
      disposalOfficerToken
    );
    assert(
      res4c.status === 403,
      'Test 4c: DISPOSAL_OFFICER cannot verify asset (403 Forbidden)'
    );

    const res4d = await request(
      port,
      'POST',
      `/api/v1/verification/${targetAssetId}/reject`,
      disposalOfficerToken,
      { rejectionReason: 'Test' }
    );
    assert(
      res4d.status === 403,
      'Test 4d: DISPOSAL_OFFICER cannot reject asset verification (403 Forbidden)'
    );

    // 5. ADMIN verifies asset in WIPING_COMPLETED state
    console.log('\n--- Test Group 3: Admin Approval Workflow ---');
    const res5 = await request(
      port,
      'POST',
      `/api/v1/verification/${targetAssetId}/verify`,
      adminToken,
      { remarks: 'Sample sector zeroing audit verified 100% clean.' }
    );
    assert(
      res5.status === 200 && res5.data.success === true,
      'Test 5: ADMIN can verify wiped asset'
    );
    assert(
      res5.data.data.asset.status === AssetStatus.VERIFIED,
      'Test 5b: Asset status transitioned to VERIFIED'
    );
    assert(
      res5.data.data.wipingRecord.verificationStatus === VerificationStatus.VERIFIED,
      'Test 5c: WipingRecord verificationStatus is VERIFIED'
    );
    assert(
      !!res5.data.data.wipingRecord.verifiedAt,
      'Test 5d: verifiedAt timestamp is populated'
    );

    // 6. Verifying an already verified asset (not in WIPING_COMPLETED) is rejected (409)
    const res6 = await request(
      port,
      'POST',
      `/api/v1/verification/${targetAssetId}/verify`,
      adminToken
    );
    assert(
      res6.status === 409,
      'Test 6: Verifying an already verified asset is rejected with 409 Conflict'
    );

    // 7. ADMIN rejects asset wiping in WIPING_COMPLETED state -> resets to WIPING_PENDING
    console.log('\n--- Test Group 4: Admin Rejection Workflow ---');
    const rejectTargetAssetId = '66e100000000000000000008'; // AST-2024-008 (WIPING_COMPLETED)

    // Rejection without reason returns 400
    const res7a = await request(
      port,
      'POST',
      `/api/v1/verification/${rejectTargetAssetId}/reject`,
      adminToken,
      { rejectionReason: '' }
    );
    assert(
      res7a.status === 400,
      'Test 7a: Rejecting without rejectionReason returns 400 Bad Request'
    );

    // Valid rejection
    const res7b = await request(
      port,
      'POST',
      `/api/v1/verification/${rejectTargetAssetId}/reject`,
      adminToken,
      {
        rejectionReason: 'Sample sector audit revealed non-zeroed residual data blocks',
        remarks: 'Please re-wipe with NIST SP 800-88 Purge 3-pass.',
      }
    );
    assert(
      res7b.status === 200 && res7b.data.success === true,
      'Test 7b: ADMIN can reject wiped asset'
    );
    assert(
      res7b.data.data.asset.status === AssetStatus.WIPING_PENDING,
      'Test 7c: Asset status reset to WIPING_PENDING for re-wiping'
    );
    assert(
      res7b.data.data.wipingRecord.verificationStatus === VerificationStatus.REJECTED,
      'Test 7d: WipingRecord verificationStatus is set to REJECTED'
    );
    assert(
      res7b.data.data.wipingRecord.rejectionReason.includes('Sample sector audit'),
      'Test 7e: rejectionReason is preserved in audit record'
    );

    // 8. Verification Details & Password Exposure Security Check
    console.log('\n--- Test Group 5: Audit Trail & Security ---');
    const res8 = await request(
      port,
      'GET',
      `/api/v1/verification/${targetAssetId}`,
      adminToken
    );
    assert(
      res8.status === 200 && res8.data.success === true,
      'Test 8a: GET /api/v1/verification/:assetId returns full verification history'
    );

    const jsonStr = JSON.stringify(res8.data);
    assert(
      !jsonStr.includes('passwordHash') && !jsonStr.includes('Password123!'),
      'Test 8b: passwordHash is never exposed in responses'
    );

    // 9. Filtering and Pagination
    console.log('\n--- Test Group 6: Queue Filtering & Pagination ---');
    const res9a = await request(
      port,
      'GET',
      '/api/v1/verification?verificationStatus=VERIFIED',
      adminToken
    );
    assert(
      res9a.status === 200 &&
        res9a.data.data.assets.every(
          (a: any) =>
            a.activeWipingRecord?.verificationStatus === VerificationStatus.VERIFIED ||
            a.wipingRecords?.some((w: any) => w.verificationStatus === VerificationStatus.VERIFIED)
        ),
      'Test 9a: Filter by verificationStatus=VERIFIED works correctly'
    );

    const res9b = await request(
      port,
      'GET',
      '/api/v1/verification?page=1&limit=2',
      adminToken
    );
    assert(
      res9b.status === 200 &&
        res9b.data.data.page === 1 &&
        res9b.data.data.limit === 2 &&
        res9b.data.data.assets.length <= 2,
      'Test 9b: Pagination (page=1, limit=2) works correctly'
    );
  } finally {
    if (server) {
      server.close();
    }
    await closeRedis();
    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
