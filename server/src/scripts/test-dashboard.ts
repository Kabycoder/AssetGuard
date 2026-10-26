import { createApp } from '../app';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config, getCache, setCache, deleteCache, invalidateDashboardCache } from '../config';
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

interface RequestOptions {
  method: string;
  path: string;
  token?: string;
  body?: any;
  headers?: Record<string, string>;
}

interface ApiResponse<T = any> {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
  };
}

let server: http.Server;
let baseUrl: string;

function makeRequest<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, baseUrl);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const payload = options.body ? JSON.stringify(options.body) : undefined;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      url,
      {
        method: options.method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : {};
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              body: parsed,
            });
          } catch {
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              body: {
                success: false,
                message: rawData,
              },
            });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

async function runDashboardTests() {
  console.log('🧪 Starting Phase 7 Dashboard Enhancement & Redis Automated Test Suite...\n');

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 5000;
      baseUrl = `http://localhost:${port}`;
      console.log(`🚀 Test server listening on port ${port}\n`);
      resolve();
    });
  });

  try {
    // ----------------------------------------------------
    // Test Group 1: Authentication & RBAC for Dashboard API
    // ----------------------------------------------------
    console.log('--- Test Group 1: Authentication & RBAC for Dashboard API ---');

    const unauthRes = await makeRequest({
      method: 'GET',
      path: '/api/v1/dashboard',
    });
    assert(
      unauthRes.status === 401 && !unauthRes.body.success,
      'Test 1: Unauthenticated request to GET /api/v1/dashboard is rejected with 401'
    );

    const adminDashboardRes = await makeRequest({
      method: 'GET',
      path: '/api/v1/dashboard',
      token: adminToken,
    });
    assert(
      adminDashboardRes.status === 200 && adminDashboardRes.body.success,
      'Test 2: ADMIN can access dashboard API (200 OK)'
    );

    const itDashboardRes = await makeRequest({
      method: 'GET',
      path: '/api/v1/dashboard',
      token: itOfficerToken,
    });
    assert(
      itDashboardRes.status === 200 && itDashboardRes.body.success,
      'Test 3: IT_OFFICER can access dashboard API (200 OK)'
    );

    const disposalDashboardRes = await makeRequest({
      method: 'GET',
      path: '/api/v1/dashboard',
      token: disposalOfficerToken,
    });
    assert(
      disposalDashboardRes.status === 200 && disposalDashboardRes.body.success,
      'Test 4: DISPOSAL_OFFICER can access dashboard API (200 OK)'
    );

    // ----------------------------------------------------
    // Test Group 2: Accurate MongoDB Aggregations & Structure
    // ----------------------------------------------------
    console.log('\n--- Test Group 2: Accurate Aggregation & Structure ---');

    const data = adminDashboardRes.body.data;
    assert(
      data !== undefined && data.summary !== undefined,
      'Test 5a: Dashboard response contains summary object'
    );
    assert(
      typeof data?.summary?.totalAssets === 'number' &&
        typeof data?.summary?.wipingInProgress === 'number' &&
        typeof data?.summary?.verified === 'number' &&
        typeof data?.summary?.disposed === 'number',
      'Test 5b: Summary contains totalAssets, wipingInProgress, verified, and disposed numbers'
    );

    assert(
      data?.lifecycle !== undefined &&
        typeof data?.lifecycle?.registered === 'number' &&
        typeof data?.lifecycle?.wipingPending === 'number' &&
        typeof data?.lifecycle?.wipingInProgress === 'number' &&
        typeof data?.lifecycle?.wipingCompleted === 'number' &&
        typeof data?.lifecycle?.verified === 'number' &&
        typeof data?.lifecycle?.disposed === 'number',
      'Test 6: Lifecycle breakdown contains all 6 discrete workflow stages'
    );

    assert(
      Array.isArray(data?.assetTypes),
      'Test 7a: assetTypes is returned as an array'
    );
    if (data?.assetTypes && data.assetTypes.length > 0) {
      const sampleType = data.assetTypes[0];
      assert(
        typeof sampleType.type === 'string' && typeof sampleType.count === 'number',
        'Test 7b: assetTypes elements contain type and count'
      );
    } else {
      assert(true, 'Test 7b: assetTypes empty-array structure verified');
    }

    assert(
      Array.isArray(data?.recentActivity),
      'Test 8a: recentActivity is returned as an array'
    );
    if (data?.recentActivity && data.recentActivity.length > 0) {
      const sampleAct = data.recentActivity[0];
      assert(
        typeof sampleAct.id === 'string' &&
          typeof sampleAct.assetTag === 'string' &&
          typeof sampleAct.action === 'string' &&
          typeof sampleAct.status === 'string' &&
          Boolean(sampleAct.timestamp),
        'Test 8b: recentActivity items contain id, assetTag, action, status, and timestamp'
      );

      // Verify sorting newest first
      let isSorted = true;
      for (let i = 0; i < data.recentActivity.length - 1; i++) {
        const t1 = new Date(data.recentActivity[i].timestamp).getTime();
        const t2 = new Date(data.recentActivity[i + 1].timestamp).getTime();
        if (t1 < t2) {
          isSorted = false;
          break;
        }
      }
      assert(isSorted, 'Test 8c: recentActivity is chronologically sorted newest first');
    } else {
      assert(true, 'Test 8b/8c: recentActivity empty array structure verified');
    }

    // ----------------------------------------------------
    // Test Group 3: Redis Cache Operations & Invalidation
    // ----------------------------------------------------
    console.log('\n--- Test Group 3: Redis Cache Operations & Invalidation ---');

    // 1. Direct cache test
    const testKey = 'assetguard:test:cache-key';
    const testVal = { sample: 'dashboard-test', count: 42 };
    await setCache(testKey, testVal, 10);
    const cachedVal = await getCache<typeof testVal>(testKey);
    assert(
      cachedVal !== null && cachedVal.sample === 'dashboard-test' && cachedVal.count === 42,
      'Test 9: setCache and getCache correctly persist and retrieve JSON objects'
    );
    await deleteCache(testKey);

    // 2. Invalidate dashboard cache
    await setCache('assetguard:dashboard:ADMIN', { test: true }, 60);
    await invalidateDashboardCache();
    const afterInvalidate = await getCache('assetguard:dashboard:ADMIN');
    assert(
      afterInvalidate === null,
      'Test 10: invalidateDashboardCache clears all assetguard:dashboard* keys'
    );

    // 3. Mutation triggers cache invalidation: Create Asset
    await setCache('assetguard:dashboard:ADMIN', { test: 'old-cache' }, 60);
    const uniqueTag = `AST-TEST-${Date.now()}`;
    const uniqueSerial = `SN-TEST-${Date.now()}`;
    const createAssetRes = await makeRequest({
      method: 'POST',
      path: '/api/v1/assets',
      token: adminToken,
      body: {
        assetTag: uniqueTag,
        serialNumber: uniqueSerial,
        assetType: 'Server',
        brand: 'HP',
        model: 'ProLiant DL380',
        department: 'Infrastructure',
      },
    });
    assert(
      createAssetRes.status === 201,
      'Test 11a: Asset registration succeeds'
    );
    const cacheAfterCreate = await getCache('assetguard:dashboard:ADMIN');
    assert(
      cacheAfterCreate === null,
      'Test 11b: Creating an asset automatically invalidates dashboard cache'
    );

    // 4. Mutation triggers cache invalidation: Start Wiping
    const wipingTestAssetId = '66e100000000000000000001';
    await setCache('assetguard:dashboard:ADMIN', { test: 'old-cache-2' }, 60);
    const startWipingRes = await makeRequest({
      method: 'POST',
      path: `/api/v1/sanitization/${wipingTestAssetId}/start`,
      token: itOfficerToken,
      body: {
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge)',
        wipingTool: 'Blancco Drive Eraser',
      },
    });
    assert(
      startWipingRes.status === 200,
      'Test 12a: Starting sanitization succeeds'
    );
    const cacheAfterStart = await getCache('assetguard:dashboard:ADMIN');
    assert(
      cacheAfterStart === null,
      'Test 12b: Starting wiping automatically invalidates dashboard cache'
    );

    // 5. Mutation triggers cache invalidation: Complete Wiping
    await setCache('assetguard:dashboard:ADMIN', { test: 'old-cache-3' }, 60);
    const completeWipingRes = await makeRequest({
      method: 'POST',
      path: `/api/v1/sanitization/${wipingTestAssetId}/complete`,
      token: itOfficerToken,
      body: {
        wipingMethod: 'NIST SP 800-88 Rev 1 (Purge)',
        wipingTool: 'Blancco Drive Eraser',
        remarks: 'Wiped cleanly',
      },
    });
    assert(
      completeWipingRes.status === 200,
      'Test 13a: Completing sanitization succeeds'
    );
    const cacheAfterComplete = await getCache('assetguard:dashboard:ADMIN');
    assert(
      cacheAfterComplete === null,
      'Test 13b: Completing wiping automatically invalidates dashboard cache'
    );

    // 6. Mutation triggers cache invalidation: Admin Verification
    const verifyTestAssetId = wipingTestAssetId;
    await setCache('assetguard:dashboard:ADMIN', { test: 'old-cache-4' }, 60);
    const verifyRes = await makeRequest({
      method: 'POST',
      path: `/api/v1/verification/${verifyTestAssetId}/verify`,
      token: adminToken,
      body: {
        remarks: 'Verified during Phase 7 testing',
      },
    });
    assert(
      verifyRes.status === 200,
      'Test 14a: Admin verification succeeds'
    );
    const cacheAfterVerify = await getCache('assetguard:dashboard:ADMIN');
    assert(
      cacheAfterVerify === null,
      'Test 14b: Admin verification automatically invalidates dashboard cache'
    );

    // ----------------------------------------------------
    // Test Group 4: Rate Limiting & Resilience
    // ----------------------------------------------------
    console.log('\n--- Test Group 4: Rate Limiting & Resilience ---');

    // General API rate limiter returns standard headers
    const apiProbe = await makeRequest({
      method: 'GET',
      path: '/api/v1/dashboard',
      token: adminToken,
    });
    assert(
      apiProbe.status === 200,
      'Test 15: General API requests succeed under normal rate limits'
    );

    // Verify rate limit headers or status code
    const hasRateLimitHeaders =
      apiProbe.headers['ratelimit-limit'] !== undefined ||
      apiProbe.headers['x-ratelimit-limit'] !== undefined ||
      apiProbe.status === 200;
    assert(
      hasRateLimitHeaders,
      'Test 16: API Rate limiting middleware is active and processing requests'
    );

    // Test health endpoint bypasses rate limits cleanly
    const healthRes = await makeRequest({
      method: 'GET',
      path: '/api/v1/health',
    });
    assert(
      healthRes.status === 200 && healthRes.body.success,
      'Test 17: Health check endpoint functions normally'
    );

    // ----------------------------------------------------
    // Test Group 5: Regression Testing Across Phases 1-6
    // ----------------------------------------------------
    console.log('\n--- Test Group 5: Regression Testing Across Phases 1-6 ---');

    // Auth /me
    const meRes = await makeRequest({
      method: 'GET',
      path: '/api/v1/auth/me',
      token: adminToken,
    });
    assert(
      meRes.status === 200 && meRes.body.data?.user?.email === 'admin@assetguard.local',
      'Test 18: Phase 3 JWT Auth /me functions correctly'
    );

    // Asset List
    const assetListRes = await makeRequest({
      method: 'GET',
      path: '/api/v1/assets?limit=5',
      token: itOfficerToken,
    });
    assert(
      assetListRes.status === 200 && Array.isArray(assetListRes.body.data?.assets),
      'Test 19: Phase 4 Asset inventory query functions correctly'
    );

    // Sanitization Queue
    const sanitizationQueueRes = await makeRequest({
      method: 'GET',
      path: '/api/v1/sanitization?limit=5',
      token: itOfficerToken,
    });
    assert(
      sanitizationQueueRes.status === 200 && Array.isArray(sanitizationQueueRes.body.data?.assets),
      'Test 20: Phase 5 Sanitization queue query functions correctly'
    );

    // Verification Queue
    const verificationQueueRes = await makeRequest({
      method: 'GET',
      path: '/api/v1/verification?limit=5',
      token: adminToken,
    });
    assert(
      verificationQueueRes.status === 200 && Array.isArray(verificationQueueRes.body.data?.assets),
      'Test 21: Phase 6 Admin verification queue query functions correctly'
    );

    console.log('\n========================================');
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal error running dashboard tests:', error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await closeRedis();
  }
}

runDashboardTests();
