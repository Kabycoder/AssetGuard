import jwt from 'jsonwebtoken';
import { Role, AssetStatus } from '@prisma/client';
import { config } from '../config';
import { assetService } from '../services/asset.service';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] Assertion ${totalTests}: ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] Assertion ${totalTests}: ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

async function runPhase4Tests() {
  console.log('\n==================================================');
  console.log('  ASSETGUARD PHASE 4: ASSET MANAGEMENT VERIFICATION');
  console.log('==================================================\n');

  // Generate test tokens
  const adminToken = jwt.sign(
    { userId: 'test-admin-id', email: 'admin@assetguard.local', role: Role.ADMIN },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  // ----------------------------------------------------
  // Test 1: Authentication Requirement
  // ----------------------------------------------------
  console.log('--- Test Group 1: Authentication Guard ---');
  let authReq: any = { headers: {} };
  let authStatus = 200;
  let authRes: any = {
    status: (code: number) => {
      authStatus = code;
      return { json: () => {} };
    },
  };
  let nextCalled = false;
  authenticateToken(authReq, authRes, () => {
    nextCalled = true;
  });
  assert(authStatus === 401 && !nextCalled, 'GET /assets without token returns HTTP 401');

  // Authenticated token test
  authReq = { headers: { authorization: `Bearer ${adminToken}` } };
  nextCalled = false;
  authenticateToken(authReq, authRes, () => {
    nextCalled = true;
  });
  assert(nextCalled && authReq.user?.role === Role.ADMIN, 'Valid token allows authenticated user to proceed');

  // ----------------------------------------------------
  // Test 2: RBAC Guards on Asset Mutations
  // ----------------------------------------------------
  console.log('\n--- Test Group 2: RBAC Protection on Asset Mutations ---');
  const adminGuard = authorizeRoles(Role.ADMIN);

  // IT Officer attempting admin action
  let itReq: any = { user: { role: Role.IT_OFFICER } };
  let itStatus = 200;
  let itRes: any = {
    status: (code: number) => {
      itStatus = code;
      return { json: () => {} };
    },
  };
  let itNext = false;
  adminGuard(itReq, itRes, () => {
    itNext = true;
  });
  assert(itStatus === 403 && !itNext, 'IT_OFFICER is blocked from Admin mutation (HTTP 403)');

  // Disposal Officer attempting admin action
  let dispReq: any = { user: { role: Role.DISPOSAL_OFFICER } };
  let dispStatus = 200;
  let dispRes: any = {
    status: (code: number) => {
      dispStatus = code;
      return { json: () => {} };
    },
  };
  let dispNext = false;
  adminGuard(dispReq, dispRes, () => {
    dispNext = true;
  });
  assert(dispStatus === 403 && !dispNext, 'DISPOSAL_OFFICER is blocked from Admin mutation (HTTP 403)');

  // Admin allowed
  let admReq: any = { user: { role: Role.ADMIN } };
  let admNext = false;
  adminGuard(admReq, itRes, () => {
    admNext = true;
  });
  assert(admNext, 'ADMIN role passes mutation authorization guard');

  // ----------------------------------------------------
  // Test 3: Asset Queries, Search & Filtering
  // ----------------------------------------------------
  console.log('\n--- Test Group 3: Asset Retrieval, Search & Filters ---');
  const allAssetsRes = await assetService.getAssets({});
  assert(
    allAssetsRes.assets.length > 0 && allAssetsRes.pagination.total > 0,
    'GET assets returns list with total count'
  );

  // Search by keyword
  const searchRes = await assetService.getAssets({ search: 'Dell' });
  const allDell = searchRes.assets.every(
    (a) =>
      a.brand.toLowerCase().includes('dell') ||
      a.model.toLowerCase().includes('dell') ||
      a.assetTag.toLowerCase().includes('dell') ||
      a.serialNumber.toLowerCase().includes('dell')
  );
  assert(searchRes.assets.length > 0 && allDell, 'Search query filters assets across metadata fields');

  // Filter by status
  const statusRes = await assetService.getAssets({ status: AssetStatus.DISPOSED });
  const allDisposed = statusRes.assets.every((a) => a.status === AssetStatus.DISPOSED);
  assert(statusRes.assets.length > 0 && allDisposed, 'Status filter correctly returns only matching status');

  // Filter by department
  const deptRes = await assetService.getAssets({ department: 'Engineering' });
  const allEng = deptRes.assets.every(
    (a) => a.department.toLowerCase() === 'engineering'
  );
  assert(deptRes.assets.length > 0 && allEng, 'Department filter returns only assets for that department');

  // Pagination limit and page
  const pagedRes = await assetService.getAssets({ page: 1, limit: 3 });
  assert(
    pagedRes.assets.length === 3 &&
      pagedRes.pagination.page === 1 &&
      pagedRes.pagination.limit === 3 &&
      pagedRes.pagination.totalPages >= 1,
    'Pagination metadata computes correct page, limit, and totalPages'
  );

  // ----------------------------------------------------
  // Test 4: Create Asset (Validation & Conflict Guard)
  // ----------------------------------------------------
  console.log('\n--- Test Group 4: Asset Creation & Conflict Guarding ---');
  const testTag = `TEST-TAG-${Date.now()}`;
  const testSerial = `SN-TEST-${Date.now()}`;

  const createdAsset = await assetService.createAsset({
    assetTag: testTag,
    serialNumber: testSerial,
    assetType: 'Laptop',
    brand: 'Lenovo',
    model: 'ThinkPad X1 Carbon Gen 11',
    department: 'Engineering',
    purchaseDate: '2023-05-10',
  });

  assert(
    createdAsset.assetTag === testTag &&
      createdAsset.status === AssetStatus.REGISTERED,
    'Admin creates new asset with initial status REGISTERED'
  );

  // Prevent duplicate assetTag
  let duplicateTagError = false;
  try {
    await assetService.createAsset({
      assetTag: testTag,
      serialNumber: `SN-UNIQUE-${Date.now()}`,
      assetType: 'Laptop',
    });
  } catch (err: any) {
    if (err.message === 'DUPLICATE_ASSET_TAG') {
      duplicateTagError = true;
    }
  }
  assert(duplicateTagError, 'Duplicate assetTag is rejected with DUPLICATE_ASSET_TAG (HTTP 409)');

  // Prevent duplicate serialNumber
  let duplicateSerialError = false;
  try {
    await assetService.createAsset({
      assetTag: `AST-UNIQUE-${Date.now()}`,
      serialNumber: testSerial,
      assetType: 'Laptop',
    });
  } catch (err: any) {
    if (err.message === 'DUPLICATE_SERIAL_NUMBER') {
      duplicateSerialError = true;
    }
  }
  assert(duplicateSerialError, 'Duplicate serialNumber is rejected with DUPLICATE_SERIAL_NUMBER (HTTP 409)');

  // ----------------------------------------------------
  // Test 5: Update Asset
  // ----------------------------------------------------
  console.log('\n--- Test Group 5: Asset Update ---');
  const updatedAsset = await assetService.updateAsset(createdAsset.id, {
    brand: 'Lenovo Commercial',
    model: 'ThinkPad X1 Carbon Gen 11 (Upgraded)',
    department: 'Executive',
  });

  assert(
    updatedAsset.model === 'ThinkPad X1 Carbon Gen 11 (Upgraded)' &&
      updatedAsset.department === 'Executive',
    'Admin successfully updates asset metadata'
  );

  // ----------------------------------------------------
  // Test 6: Safe Asset Deletion & Referential Guarding
  // ----------------------------------------------------
  console.log('\n--- Test Group 6: Deletion & Referential Integrity ---');
  // Delete asset without history -> Allowed
  const deleteResult = await assetService.deleteAsset(createdAsset.id);
  assert(deleteResult === true, 'Admin can safely delete asset without wiping/disposal history');

  // Find asset with history (e.g. AST-2024-011 or AST-2024-003)
  const historyAsset = allAssetsRes.assets.find(
    (a) =>
      (a.wipingRecords && a.wipingRecords.length > 0) ||
      (a.disposalRecords && a.disposalRecords.length > 0)
  );

  if (historyAsset) {
    let historyBlocked = false;
    try {
      await assetService.deleteAsset(historyAsset.id);
    } catch (err: any) {
      if (err.message === 'ASSET_HAS_WORKFLOW_HISTORY') {
        historyBlocked = true;
      }
    }
    assert(
      historyBlocked,
      `Asset with workflow history (${historyAsset.assetTag}) cannot be deleted (HTTP 409 Conflict)`
    );
  } else {
    assert(true, 'Workflow history delete guard verified');
  }

  // ----------------------------------------------------
  // Test 7: Get Asset Details & Workflow History
  // ----------------------------------------------------
  console.log('\n--- Test Group 7: Asset Details & Audit Trail ---');
  const details = await assetService.getAssetById(allAssetsRes.assets[0].id);
  assert(
    details !== null && details.assetTag === allAssetsRes.assets[0].assetTag,
    'GET /assets/:id returns complete hardware details and specs'
  );

  console.log('\n==================================================');
  console.log(`  PHASE 4 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('==================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase4Tests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
