import { createApp } from '../app';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
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
  console.log('🧪 Starting AssetGuard Complete E2E Lifecycle & Security Automated Test Suite...\n');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const address = server.address() as any;
  const port = address.port;
  console.log(`🚀 E2E Test Server listening on port ${port}\n`);

  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message || err}`);
      failed++;
    }
  };

  try {
    // ==========================================
    // SECTION 1: SYSTEM HEALTH & SECURITY HEADERS
    // ==========================================
    console.log('--- SECTION 1: System Health & Security Hardening ---');

    await test('Health check endpoint returns HTTP 200 with service status', async () => {
      const res = await request(port, 'GET', '/api/v1/health');
      if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
      if (!res.data.success) throw new Error('Expected success: true in health check');
    });

    await test('Helmet security headers are properly attached', async () => {
      const res = await request(port, 'GET', '/api/v1/health');
      if (!res.headers['x-content-type-options']) {
        throw new Error('Missing x-content-type-options header');
      }
      if (!res.headers['x-frame-options']) {
        throw new Error('Missing x-frame-options header');
      }
    });

    await test('Rate limiting headers are returned on API requests', async () => {
      const res = await request(port, 'GET', '/api/v1/assets');
      const limitHeader =
        res.headers['ratelimit-limit'] ||
        res.headers['x-ratelimit-limit'] ||
        res.headers['ratelimit-policy'];
      if (!limitHeader) {
        throw new Error('Missing rate limit header on /api/v1/assets');
      }
    });

    // ==========================================
    // SECTION 2: AUTHENTICATION & RBAC ENFORCEMENT
    // ==========================================
    console.log('\n--- SECTION 2: Authentication & RBAC Guardrails ---');

    await test('Unauthenticated request to protected endpoint returns 401 Unauthorized', async () => {
      const res = await request(port, 'GET', '/api/v1/assets');
      if (res.status !== 401) throw new Error(`Expected status 401, got ${res.status}`);
    });

    await test('Invalid or forged JWT token returns 401 Unauthorized', async () => {
      const res = await request(port, 'GET', '/api/v1/assets', 'invalid.jwt.token');
      if (res.status !== 401) throw new Error(`Expected status 401, got ${res.status}`);
    });

    await test('Valid JWT allows authorized user access', async () => {
      const res = await request(port, 'GET', '/api/v1/assets', adminToken);
      if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
      if (!res.data.success) throw new Error('Expected success: true');
    });

    // ==========================================
    // SECTION 3: ASSET CREATION & REGISTRATION
    // ==========================================
    console.log('\n--- SECTION 3: Asset Registration & Lifecycle Start ---');

    let testAssetId = '';
    const testTag = `AST-E2E-${Date.now().toString().slice(-4)}`;

    await test('Non-admin roles cannot create assets (403 Forbidden)', async () => {
      const res = await request(port, 'POST', '/api/v1/assets', itOfficerToken, {
        assetTag: testTag,
        serialNumber: `SN-E2E-${Date.now()}`,
        assetType: 'Laptop',
      });
      if (res.status !== 403) {
        throw new Error(`Expected status 403 Forbidden, got ${res.status}`);
      }
    });

    await test('Admin registers a new decommissioned asset', async () => {
      const res = await request(port, 'POST', '/api/v1/assets', adminToken, {
        assetTag: testTag,
        serialNumber: `SN-E2E-${Date.now()}`,
        assetType: 'Laptop',
        brand: 'Lenovo',
        model: 'ThinkPad X1 Carbon Gen 11',
        department: 'Engineering',
      });
      if (res.status !== 201 && res.status !== 200) {
        throw new Error(`Expected 201/200, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      testAssetId = res.data.data?.asset?.id || res.data.data?.id;
      if (!testAssetId) throw new Error('Asset ID was not returned');
      const status = res.data.data?.asset?.status || res.data.data?.status;
      if (status !== 'REGISTERED' && status !== 'WIPING_PENDING') {
        throw new Error(`Expected REGISTERED or WIPING_PENDING status, got ${status}`);
      }
    });

    // ==========================================
    // SECTION 4: DATA SANITIZATION & WIPING (NIST 800-88)
    // ==========================================
    console.log('\n--- SECTION 4: Data Sanitization (NIST SP 800-88 / DoD 5220.22-M) ---');

    await test('IT Officer starts data wiping on registered asset', async () => {
      const res = await request(
        port,
        'POST',
        `/api/v1/sanitization/${testAssetId}/start`,
        itOfficerToken,
        {
          wipingMethod: 'NIST SP 800-88 Rev 1',
          wipingTool: 'Blancco Drive Eraser',
          remarks: 'Starting 3-pass cryptographic wipe.',
        }
      );
      if (res.status !== 200) {
        throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      if (res.data.data.asset.status !== 'WIPING_IN_PROGRESS') {
        throw new Error(`Expected WIPING_IN_PROGRESS, got ${res.data.data.asset.status}`);
      }
    });

    await test('IT Officer completes data wiping successfully', async () => {
      const res = await request(
        port,
        'POST',
        `/api/v1/sanitization/${testAssetId}/complete`,
        itOfficerToken,
        {
          wipingMethod: 'NIST SP 800-88 Rev 1',
          wipingTool: 'Blancco Drive Eraser',
          remarks: 'All disk sectors verified zeroed. Hash check passed.',
        }
      );
      if (res.status !== 200) {
        throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      if (res.data.data.asset.status !== 'WIPING_COMPLETED') {
        throw new Error(`Expected WIPING_COMPLETED, got ${res.data.data.asset.status}`);
      }
    });

    // ==========================================
    // SECTION 5: VERIFICATION & AUDIT REJECTION / APPROVAL
    // ==========================================
    console.log('\n--- SECTION 5: Admin Verification & QA Reject/Approve Workflow ---');

    await test('Disposal Officer cannot approve verification (Strict ADMIN role enforcement)', async () => {
      const res = await request(
        port,
        'POST',
        `/api/v1/verification/${testAssetId}/verify`,
        disposalOfficerToken,
        { remarks: 'Attempt unauthorized verification' }
      );
      if (res.status !== 403) {
        throw new Error(`Expected status 403 Forbidden, got ${res.status}`);
      }
    });

    await test('Admin QA rejection returns asset to WIPING_PENDING with recorded reason', async () => {
      const res = await request(
        port,
        'POST',
        `/api/v1/verification/${testAssetId}/reject`,
        adminToken,
        {
          rejectionReason: 'Sector audit sample checksum mismatch on block #8849',
          remarks: 'Requires full re-wipe with DoD 5220.22-M 7-pass.',
        }
      );
      if (res.status !== 200) {
        throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      if (res.data.data.asset.status !== 'WIPING_PENDING') {
        throw new Error(`Expected WIPING_PENDING status after rejection, got ${res.data.data.asset.status}`);
      }
    });

    await test('IT Officer re-wipes and marks asset completed again', async () => {
      // Re-start
      await request(port, 'POST', `/api/v1/sanitization/${testAssetId}/start`, itOfficerToken, {
        wipingMethod: 'DoD 5220.22-M',
        wipingTool: 'DBAN Enterprise',
        remarks: 'Re-wiping following QA audit notes.',
      });
      // Re-complete
      const res = await request(port, 'POST', `/api/v1/sanitization/${testAssetId}/complete`, itOfficerToken, {
        wipingMethod: 'DoD 5220.22-M',
        wipingTool: 'DBAN Enterprise',
        remarks: '7-pass overwrite completed with 100% verification.',
      });
      if (res.status !== 200) throw new Error('Failed to re-complete wiping');
      if (res.data.data.asset.status !== 'WIPING_COMPLETED') {
        throw new Error(`Expected WIPING_COMPLETED, got ${res.data.data.asset.status}`);
      }
    });

    await test('Admin verifies and approves sanitization (Transitions to VERIFIED)', async () => {
      const res = await request(
        port,
        'POST',
        `/api/v1/verification/${testAssetId}/verify`,
        adminToken,
        {
          remarks: 'Re-audit passed 100%. Checksums verified clean.',
        }
      );
      if (res.status !== 200) {
        throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      if (res.data.data.asset.status !== 'VERIFIED') {
        throw new Error(`Expected VERIFIED, got ${res.data.data.asset.status}`);
      }
    });

    // ==========================================
    // SECTION 6: DISPOSAL & CERTIFICATE OF DESTRUCTION (COD)
    // ==========================================
    console.log('\n--- SECTION 6: Final Asset Disposition & COD Generation ---');

    await test('IT Officer cannot execute physical disposition (Restricted to DISPOSAL_OFFICER & ADMIN)', async () => {
      const res = await request(
        port,
        'POST',
        `/api/v1/disposal/${testAssetId}`,
        itOfficerToken,
        {
          disposalMethod: 'RECYCLING',
          vendorName: 'EcoRecycle Solutions Inc.',
        }
      );
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for IT_OFFICER on disposal, got ${res.status}`);
      }
    });

    const codNumber = `COD-E2E-${Date.now().toString().slice(-6)}`;

    await test('Disposal Officer records R2 recycling and generates Certificate of Destruction', async () => {
      const res = await request(
        port,
        'POST',
        `/api/v1/disposal/${testAssetId}`,
        disposalOfficerToken,
        {
          disposalMethod: 'RECYCLING',
          vendorName: 'EcoRecycle Solutions Inc.',
          certificateNumber: codNumber,
          remarks: 'Transferred to R2 certified facility with zero landfill guarantee.',
        }
      );
      if (res.status !== 200) {
        throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      if (res.data.data.asset.status !== 'DISPOSED') {
        throw new Error(`Expected DISPOSED status, got ${res.data.data.asset.status}`);
      }
      if (res.data.data.disposalRecord.certificateNumber !== codNumber) {
        throw new Error(`Expected COD number ${codNumber}, got ${res.data.data.disposalRecord.certificateNumber}`);
      }
    });

    await test('Disposal details and Certificate of Destruction are retrievable by asset ID', async () => {
      const res = await request(
        port,
        'GET',
        `/api/v1/disposal/${testAssetId}`,
        disposalOfficerToken
      );
      if (res.status !== 200) {
        throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
      if (res.data.data.status !== 'DISPOSED') {
        throw new Error(`Expected status DISPOSED, got ${res.data.data.status}`);
      }
    });

    await test('Attempting to re-dispose an already DISPOSED asset returns 409 Conflict', async () => {
      const res = await request(
        port,
        'POST',
        `/api/v1/disposal/${testAssetId}`,
        disposalOfficerToken,
        {
          disposalMethod: 'PHYSICAL_SHREDDING',
        }
      );
      if (res.status !== 409) {
        throw new Error(`Expected 409 Conflict for double disposition, got ${res.status}`);
      }
    });

    // ==========================================
    // SECTION 7: DASHBOARD METRICS & CACHE CONSISTENCY
    // ==========================================
    console.log('\n--- SECTION 7: Dashboard Aggregation & Cache Consistency ---');

    await test('Dashboard returns valid metrics and lifecycle distribution', async () => {
      const res = await request(port, 'GET', '/api/v1/dashboard', adminToken);
      if (res.status !== 200) {
        throw new Error(`Expected status 200, got ${res.status}`);
      }
      const data = res.data.data;
      if (typeof data.summary?.totalAssets !== 'number') {
        throw new Error('totalAssets is not a number');
      }
      if (typeof data.summary?.disposed !== 'number') {
        throw new Error('disposed count is not a number');
      }
      if (!Array.isArray(data.assetTypes)) {
        throw new Error('assetTypes is not an array');
      }
    });

  } finally {
    server.close();
    await closeRedis();
  }

  console.log('\n==================================================');
  console.log(`🏁 E2E Lifecycle & Security Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
