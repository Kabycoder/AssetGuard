import { createApp } from '../app';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config';
import { closeRedis } from '../config/redis';
import http from 'http';

function generateToken(userId: string, email: string, role: Role): string {
  return jwt.sign({ userId, email, role }, config.jwtSecret, { expiresIn: '1h' });
}

const adminToken = generateToken('a1b2c3d4e5f64a1b8c2d3e4f', 'admin@assetguard.local', Role.ADMIN);
const itOfficerToken = generateToken('b2c3d4e5f6a14b2c9d3e4f5a', 'it@assetguard.local', Role.IT_OFFICER);
const disposalOfficerToken = generateToken('c3d4e5f6a1b24c3dae4f5a6b', 'disposal@assetguard.local', Role.DISPOSAL_OFFICER);

async function request(
  serverPort: number,
  method: string,
  path: string,
  token?: string,
  body?: any
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders; text: string }> {
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
            text: responseData,
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

async function runConsistencyTests() {
  console.log('🧪 Starting AssetGuard Global Data Consistency & Asset Synchronization Test Suite...\n');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const address = server.address() as any;
  const port = address.port;
  console.log(`🚀 Consistency Test Server listening on port ${port}\n`);

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
    // 1. REGISTRATION & CONSTRAINTS
    // ==========================================
    console.log('--- 1. Registration & Duplicate Constraints ---');

    const uniqueTag = `AST-SYNC-${Date.now().toString().slice(-4)}`;
    const uniqueSerial = `SN-SYNC-${Date.now().toString().slice(-4)}`;
    let createdAssetId = '';

    await test('Admin registers a new asset into inventory', async () => {
      const res = await request(port, 'POST', '/api/v1/assets', adminToken, {
        assetTag: uniqueTag,
        serialNumber: uniqueSerial,
        assetType: 'Laptop',
        brand: 'Dell',
        model: 'Latitude 7430',
        department: 'Operations',
      });
      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
      createdAssetId = res.data.data?.asset?.id || res.data.data?.id;
      if (!createdAssetId) throw new Error('Asset ID not returned');
    });

    await test('Duplicate asset tag is rejected with 409 Conflict', async () => {
      const res = await request(port, 'POST', '/api/v1/assets', adminToken, {
        assetTag: uniqueTag,
        serialNumber: `SN-ANOTHER-${Date.now()}`,
        assetType: 'Laptop',
        brand: 'Dell',
        model: 'Latitude 7430',
        department: 'Operations',
      });
      if (res.status !== 409) throw new Error(`Expected 409 Conflict, got ${res.status}`);
    });

    await test('Duplicate serial number is rejected with 409 Conflict', async () => {
      const res = await request(port, 'POST', '/api/v1/assets', adminToken, {
        assetTag: `AST-ANOTHER-${Date.now()}`,
        serialNumber: uniqueSerial,
        assetType: 'Laptop',
        brand: 'Dell',
        model: 'Latitude 7430',
        department: 'Operations',
      });
      if (res.status !== 409) throw new Error(`Expected 409 Conflict, got ${res.status}`);
    });

    // ==========================================
    // 2. CROSS-MODULE LIFECYCLE SYNCHRONIZATION
    // ==========================================
    console.log('\n--- 2. Cross-Module Lifecycle Synchronization ---');

    await test('Asset appears in Assets inventory and Sanitization queue with REGISTERED status', async () => {
      const assetRes = await request(port, 'GET', `/api/v1/assets/${createdAssetId}`, adminToken);
      if (assetRes.status !== 200) throw new Error(`Assets page fetch failed: ${assetRes.status}`);
      const st = assetRes.data.data?.asset?.status || assetRes.data.data?.status;
      if (st !== 'REGISTERED') throw new Error(`Expected REGISTERED, got ${st}`);

      const sanitizationQueue = await request(port, 'GET', `/api/v1/sanitization?search=${uniqueTag}`, itOfficerToken);
      if (sanitizationQueue.status !== 200) throw new Error(`Sanitization queue fetch failed: ${sanitizationQueue.status}`);
      const found = sanitizationQueue.data.data?.assets?.some((a: any) => a.id === createdAssetId);
      if (!found) throw new Error('Asset not found in Sanitization queue');
    });

    await test('Starting sanitization updates status to WIPING_IN_PROGRESS across all modules', async () => {
      const startRes = await request(port, 'POST', `/api/v1/sanitization/${createdAssetId}/start`, itOfficerToken, {
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge)',
        wipingTool: 'Blancco Drive Eraser',
      });
      if (startRes.status !== 200) throw new Error(`Start wiping failed: ${startRes.status}`);

      // Verify on Assets endpoint
      const assetRes = await request(port, 'GET', `/api/v1/assets/${createdAssetId}`, adminToken);
      const st = assetRes.data.data?.asset?.status || assetRes.data.data?.status;
      if (st !== 'WIPING_IN_PROGRESS') {
        throw new Error(`Expected WIPING_IN_PROGRESS on assets endpoint, got ${st}`);
      }

      // Verify on Dashboard
      const dashRes = await request(port, 'GET', '/api/v1/dashboard', adminToken);
      if (dashRes.data.data?.lifecycle?.wipingInProgress < 1) {
        throw new Error('Dashboard lifecycle wipingInProgress did not reflect active wipe');
      }
    });

    await test('Completing wiping updates Asset status to WIPING_COMPLETED and enters Verification queue', async () => {
      const compRes = await request(port, 'POST', `/api/v1/sanitization/${createdAssetId}/complete`, itOfficerToken, {
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge)',
        wipingTool: 'Blancco Drive Eraser',
        remarks: 'Zero-overwrite verification complete.',
      });
      if (compRes.status !== 200) throw new Error(`Complete wiping failed: ${compRes.status}`);

      // Verify on Verification queue
      const verifQueue = await request(port, 'GET', `/api/v1/verification?search=${uniqueTag}`, adminToken);
      if (verifQueue.status !== 200) throw new Error(`Verification queue failed: ${verifQueue.status}`);
      const found = verifQueue.data.data?.assets?.some((a: any) => a.id === createdAssetId);
      if (!found) throw new Error('Wiped asset did not enter Verification queue');
    });

    await test('Admin Verification approves asset and transitions it into Disposal ready queue', async () => {
      const verifRes = await request(port, 'POST', `/api/v1/verification/${createdAssetId}/verify`, adminToken, {
        remarks: 'Cryptographic wiping audit passed.',
      });
      if (verifRes.status !== 200) throw new Error(`Verification approval failed: ${verifRes.status}`);
      if (verifRes.data.data?.asset?.status !== 'VERIFIED') {
        throw new Error(`Expected VERIFIED status, got ${verifRes.data.data?.asset?.status}`);
      }

      // Verify on Disposal queue
      const dispQueue = await request(port, 'GET', '/api/v1/disposal', disposalOfficerToken);
      if (dispQueue.status !== 200) throw new Error(`Disposal queue fetch failed: ${dispQueue.status}`);
      const inVerifiedQueue = dispQueue.data.data?.verifiedQueue?.some((a: any) => a.id === createdAssetId);
      if (!inVerifiedQueue) throw new Error('VERIFIED asset not found in Disposal verified queue');
    });

    const codNumber = `COD-SYNC-${Date.now().toString().slice(-4)}`;

    await test('Disposal Officer executes disposition, assigns COD, and marks asset DISPOSED', async () => {
      const dispRes = await request(port, 'POST', `/api/v1/disposal/${createdAssetId}`, disposalOfficerToken, {
        disposalMethod: 'RECYCLING',
        vendorName: 'EcoRecycle Solutions Inc.',
        certificateNumber: codNumber,
        remarks: 'Hardware recycled in compliance with R2v3 standards.',
      });
      if (dispRes.status !== 200) throw new Error(`Disposal execution failed: ${dispRes.status}`);
      if (dispRes.data.data?.asset?.status !== 'DISPOSED') {
        throw new Error(`Expected DISPOSED status, got ${dispRes.data.data?.asset?.status}`);
      }
    });

    // ==========================================
    // 3. DELETION CONSISTENCY & AUDIT PROTECTION
    // ==========================================
    console.log('\n--- 3. Deletion Consistency & Audit Trail Integrity ---');

    await test('Assets with workflow/audit history CANNOT be deleted (409 Conflict)', async () => {
      const delRes = await request(port, 'DELETE', `/api/v1/assets/${createdAssetId}`, adminToken);
      if (delRes.status !== 409) {
        throw new Error(`Expected 409 Conflict when deleting audited asset, got ${delRes.status}`);
      }
      if (delRes.data.error !== 'ASSET_HAS_WORKFLOW_HISTORY') {
        throw new Error(`Expected ASSET_HAS_WORKFLOW_HISTORY error code, got ${delRes.data.error}`);
      }
    });

    let freshAssetId = '';
    const freshTag = `AST-FRESH-${Date.now().toString().slice(-4)}`;

    await test('Unworked asset without history can be deleted safely', async () => {
      const createRes = await request(port, 'POST', '/api/v1/assets', adminToken, {
        assetTag: freshTag,
        serialNumber: `SN-FRESH-${Date.now()}`,
        assetType: 'Server',
        brand: 'HP',
        model: 'ProLiant',
        department: 'IT',
      });
      freshAssetId = createRes.data.data?.asset?.id || createRes.data.data?.id;

      const delRes = await request(port, 'DELETE', `/api/v1/assets/${freshAssetId}`, adminToken);
      if (delRes.status !== 200) throw new Error(`Expected 200 on unworked asset deletion, got ${delRes.status}`);

      // Verify immediate disappearance from assets endpoint
      const getRes = await request(port, 'GET', `/api/v1/assets/${freshAssetId}`, adminToken);
      if (getRes.status !== 404) {
        throw new Error(`Expected 404 for deleted asset, got ${getRes.status}`);
      }
    });

    // ==========================================
    // 4. REPORTS CONSISTENCY & EXPORT INTEGRATION
    // ==========================================
    console.log('\n--- 4. Reports Consistency & Export Integration ---');

    await test('Reports summary returns live metrics reflecting all asset states', async () => {
      const repSum = await request(port, 'GET', '/api/v1/reports/summary', adminToken);
      if (repSum.status !== 200) throw new Error(`Report summary failed: ${repSum.status}`);
      if (typeof repSum.data.data?.totalAssets !== 'number') throw new Error('totalAssets is missing');
      if (repSum.data.data?.disposedAssets < 1) throw new Error('disposedAssets count should be at least 1');
    });

    await test('Full Disposition CSV export contains live asset with COD number', async () => {
      const csvRes = await request(port, 'GET', '/api/v1/reports/export?type=Complete_Disposition', adminToken);
      if (csvRes.status !== 200) throw new Error(`CSV export failed: ${csvRes.status}`);
      if (!csvRes.headers['content-type']?.includes('text/csv')) {
        throw new Error(`Expected text/csv content-type, got ${csvRes.headers['content-type']}`);
      }
      if (!csvRes.text.includes(uniqueTag)) {
        throw new Error(`Exported CSV does not include newly disposed asset ${uniqueTag}`);
      }
      if (!csvRes.text.includes(codNumber)) {
        throw new Error(`Exported CSV does not include certificate number ${codNumber}`);
      }
    });

    await test('NIST Sanitization Log CSV export includes sanitization audit history', async () => {
      const csvRes = await request(port, 'GET', '/api/v1/reports/export?type=NIST_Sanitization_Log', adminToken);
      if (csvRes.status !== 200) throw new Error(`NIST log export failed: ${csvRes.status}`);
      if (!csvRes.text.includes(uniqueTag)) {
        throw new Error(`NIST log does not include wiped asset ${uniqueTag}`);
      }
      if (!csvRes.text.includes('Blancco Drive Eraser')) {
        throw new Error('NIST log does not include wiping tool');
      }
    });

    await test('COD Manifest CSV export includes disposition record', async () => {
      const csvRes = await request(port, 'GET', '/api/v1/reports/export?type=COD_Manifest', adminToken);
      if (csvRes.status !== 200) throw new Error(`COD manifest export failed: ${csvRes.status}`);
      if (!csvRes.text.includes(codNumber)) {
        throw new Error(`COD manifest does not include COD number ${codNumber}`);
      }
    });

  } finally {
    server.close();
    await closeRedis();
  }

  console.log('\n==================================================');
  console.log(`🏁 Data Consistency Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runConsistencyTests().catch((err) => {
  console.error('Fatal consistency test error:', err);
  process.exit(1);
});
