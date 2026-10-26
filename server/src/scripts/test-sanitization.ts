import { createApp } from '../app';
import jwt from 'jsonwebtoken';
import { Role, AssetStatus, WipingStatus, VerificationStatus } from '@prisma/client';
import { config } from '../config';
import { closeRedis } from '../config/redis';
import http from 'http';

// Helper to generate test JWTs
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

// Simple HTTP request helper
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
  console.log('🧪 Starting Phase 5 Sanitization Workflow Automated Test Suite...\n');

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
    const res1 = await request(port, 'GET', '/api/v1/sanitization');
    assert(
      res1.status === 401,
      'Test 1: Unauthenticated request to GET /api/v1/sanitization is rejected with 401'
    );

    // 2. ADMIN can view sanitization records
    const res2 = await request(port, 'GET', '/api/v1/sanitization', adminToken);
    assert(
      res2.status === 200 && res2.data.success === true,
      'Test 2: ADMIN can view sanitization queue (200 OK)'
    );

    // 3. IT_OFFICER can view sanitization records
    const res3 = await request(port, 'GET', '/api/v1/sanitization', itOfficerToken);
    assert(
      res3.status === 200 &&
        res3.data.success === true &&
        Array.isArray(res3.data.data.assets),
      'Test 3: IT_OFFICER can view sanitization queue with assets list (200 OK)'
    );

    // 4. DISPOSAL_OFFICER cannot start, complete, or fail wiping (403)
    console.log('\n--- Test Group 2: Role Restrictions ---');
    const targetAssetId = '66e100000000000000000001'; // AST-2024-001 (REGISTERED)

    const res4a = await request(
      port,
      'POST',
      `/api/v1/sanitization/${targetAssetId}/start`,
      disposalOfficerToken
    );
    assert(
      res4a.status === 403,
      'Test 4a: DISPOSAL_OFFICER cannot start wiping (403 Forbidden)'
    );

    const res4b = await request(
      port,
      'POST',
      `/api/v1/sanitization/${targetAssetId}/complete`,
      disposalOfficerToken,
      { wipingMethod: 'NIST 800-88', wipingTool: 'Blancco' }
    );
    assert(
      res4b.status === 403,
      'Test 4b: DISPOSAL_OFFICER cannot complete wiping (403 Forbidden)'
    );

    const res4c = await request(
      port,
      'POST',
      `/api/v1/sanitization/${targetAssetId}/fail`,
      disposalOfficerToken,
      { reason: 'Bad sectors' }
    );
    assert(
      res4c.status === 403,
      'Test 4c: DISPOSAL_OFFICER cannot mark wiping as failed (403 Forbidden)'
    );

    // 5. IT_OFFICER can start wiping on eligible asset -> WIPING_IN_PROGRESS
    console.log('\n--- Test Group 3: Wiping Lifecycle Transitions ---');
    const res5 = await request(
      port,
      'POST',
      `/api/v1/sanitization/${targetAssetId}/start`,
      itOfficerToken,
      {
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge)',
        wipingTool: 'Blancco Drive Eraser v7.8',
        remarks: 'Automated test wiping job started.',
      }
    );
    assert(
      res5.status === 200 && res5.data.success === true,
      'Test 5: IT_OFFICER can start wiping on REGISTERED asset'
    );
    assert(
      res5.data.data.asset.status === AssetStatus.WIPING_IN_PROGRESS,
      'Test 5b: Asset status transitioned to WIPING_IN_PROGRESS'
    );
    assert(
      res5.data.data.wipingRecord.status === WipingStatus.IN_PROGRESS &&
        res5.data.data.wipingRecord.verificationStatus === VerificationStatus.PENDING,
      'Test 5c: WipingRecord status is IN_PROGRESS and verificationStatus is PENDING'
    );

    // 6. Starting an already active wipe is rejected (409 Conflict)
    const res6 = await request(
      port,
      'POST',
      `/api/v1/sanitization/${targetAssetId}/start`,
      itOfficerToken
    );
    assert(
      res6.status === 409,
      'Test 6: Starting an already active wipe is rejected with 409 Conflict'
    );

    // 7. IT_OFFICER can complete wiping -> WIPING_COMPLETED (NOT VERIFIED)
    const res7 = await request(
      port,
      'POST',
      `/api/v1/sanitization/${targetAssetId}/complete`,
      itOfficerToken,
      {
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge / Cryptographic Erase)',
        wipingTool: 'Blancco Enterprise Data Eraser v8.2',
        remarks: 'All SSD sectors zeroed. Checksum verified.',
      }
    );
    assert(
      res7.status === 200 && res7.data.success === true,
      'Test 7: IT_OFFICER can complete wiping'
    );
    assert(
      res7.data.data.asset.status === AssetStatus.WIPING_COMPLETED,
      'Test 7b: Asset status transitioned to WIPING_COMPLETED (NOT VERIFIED)'
    );
    assert(
      res7.data.data.asset.status !== AssetStatus.VERIFIED &&
        res7.data.data.wipingRecord.verificationStatus === VerificationStatus.PENDING,
      'Test 7c: Asset is NOT marked VERIFIED (Verification reserved for Phase 6 Admin Verification)'
    );

    // 8. Completing an asset not in WIPING_IN_PROGRESS is rejected (409)
    const res8 = await request(
      port,
      'POST',
      `/api/v1/sanitization/${targetAssetId}/complete`,
      itOfficerToken,
      {
        wipingMethod: 'NIST 800-88',
        wipingTool: 'Blancco',
      }
    );
    assert(
      res8.status === 409,
      'Test 8: Completing wiping on non-active asset is rejected with 409 Conflict'
    );

    // 9. Required fields validation on complete
    // Let's start wiping on another asset first: AST-2024-002
    const asset2Id = '66e100000000000000000002';
    await request(port, 'POST', `/api/v1/sanitization/${asset2Id}/start`, itOfficerToken);

    const res9 = await request(
      port,
      'POST',
      `/api/v1/sanitization/${asset2Id}/complete`,
      itOfficerToken,
      { wipingMethod: '' } // missing tool and empty method
    );
    assert(
      res9.status === 400,
      'Test 9: Completing wiping without required wipingMethod and wipingTool returns 400'
    );

    // 10. IT_OFFICER marks wiping as failed -> asset resets to WIPING_PENDING
    console.log('\n--- Test Group 4: Failure Handling & Audit Preservation ---');
    const res10 = await request(
      port,
      'POST',
      `/api/v1/sanitization/${asset2Id}/fail`,
      itOfficerToken,
      {
        reason: 'Uncorrectable bad sectors on LBA 0x4F80',
        remarks: 'Drive failed pass 2 verify check.',
      }
    );
    assert(
      res10.status === 200 && res10.data.success === true,
      'Test 10: IT_OFFICER can mark wiping as failed'
    );
    assert(
      res10.data.data.asset.status === AssetStatus.WIPING_PENDING,
      'Test 10b: Asset status returned to WIPING_PENDING for re-sanitization'
    );
    assert(
      res10.data.data.wipingRecord.status === WipingStatus.FAILED,
      'Test 10c: WipingRecord status is set to FAILED and preserved in audit trail'
    );

    // 11. Failing an asset not in WIPING_IN_PROGRESS is rejected (409)
    const res11 = await request(
      port,
      'POST',
      `/api/v1/sanitization/${asset2Id}/fail`,
      itOfficerToken,
      { reason: 'Test' }
    );
    assert(
      res11.status === 409,
      'Test 11: Marking an inactive asset as failed is rejected with 409 Conflict'
    );

    // 12. Sanitization History returns full records with technician info and no passwordHash
    console.log('\n--- Test Group 5: History & Data Security ---');
    const res12 = await request(
      port,
      'GET',
      `/api/v1/sanitization/${asset2Id}`,
      itOfficerToken
    );
    assert(
      res12.status === 200 && res12.data.success === true,
      'Test 12: GET /api/v1/sanitization/:assetId returns asset history'
    );
    assert(
      res12.data.data.wipingRecords && res12.data.data.wipingRecords.length > 0,
      'Test 12b: Wiping history preserves failed wiping record'
    );

    const jsonStr = JSON.stringify(res12.data);
    assert(
      !jsonStr.includes('passwordHash') && !jsonStr.includes('Password123!'),
      'Test 12c: passwordHash is never exposed in responses'
    );

    // 13. Filters and Pagination in Sanitization Queue
    console.log('\n--- Test Group 6: Queue Filtering & Pagination ---');
    const res13a = await request(
      port,
      'GET',
      '/api/v1/sanitization?status=WIPING_PENDING',
      adminToken
    );
    assert(
      res13a.status === 200 &&
        res13a.data.data.assets.every(
          (a: any) => a.status === AssetStatus.WIPING_PENDING
        ),
      'Test 13a: Filter by status=WIPING_PENDING works correctly'
    );

    const res13b = await request(
      port,
      'GET',
      '/api/v1/sanitization?page=1&limit=3',
      adminToken
    );
    assert(
      res13b.status === 200 &&
        res13b.data.data.page === 1 &&
        res13b.data.data.limit === 3 &&
        res13b.data.data.assets.length <= 3,
      'Test 13b: Pagination (page=1, limit=3) works correctly'
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
