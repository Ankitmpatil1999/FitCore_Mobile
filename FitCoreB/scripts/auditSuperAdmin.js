require('dotenv').config();
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:7000/api';

async function runSuperAdminAudit() {
  console.log('====================================================');
  console.log('⚡ STARTING SUPER ADMIN FULL BACKEND & API AUDIT');
  console.log('====================================================\n');

  const token = jwt.sign(
    { id: '6a934afd13a1b16c3767d90e', role: 'super_admin' },
    process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production'
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const results = [];

  async function testEndpoint(name, method, path, body = null, checkFn = null) {
    try {
      const options = {
        method,
        headers: authHeaders,
      };
      if (body) options.body = JSON.stringify(body);

      const startTime = Date.now();
      const res = await fetch(`${BASE_URL}${path}`, options);
      const duration = Date.now() - startTime;
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        data = { error: 'Failed to parse JSON response' };
      }

      const statusOk = res.ok && (data.success !== false);
      const customCheck = checkFn ? checkFn(data) : true;
      const passed = statusOk && customCheck;

      results.push({
        name,
        method,
        path,
        status: res.status,
        passed,
        duration: `${duration}ms`,
        details: passed ? 'OK' : JSON.stringify(data).slice(0, 120)
      });

      console.log(`[${passed ? '✅ PASS' : '❌ FAIL'}] ${method} ${path} (${res.status} - ${duration}ms) - ${name}`);
      return data;
    } catch (err) {
      results.push({
        name,
        method,
        path,
        status: 'ERR',
        passed: false,
        duration: '0ms',
        details: err.message
      });
      console.log(`[❌ ERR ] ${method} ${path} - ${err.message}`);
      return null;
    }
  }

  // 1. Auth & Admin Metrics
  await testEndpoint('Super Admin Metrics', 'GET', '/admin/metrics');
  await testEndpoint('Hub Live Telemetry', 'GET', '/admin/hub-telemetry');
  await testEndpoint('Super Admin Global Config', 'GET', '/admin/config');

  // 2. Gyms Franchise Management
  const gymsData = await testEndpoint('List All Gyms', 'GET', '/admin/gyms');
  const sampleGym = gymsData?.data?.[0];

  // 3. Members Management
  await testEndpoint('List All Members Across Network', 'GET', '/admin/members');

  // 4. SaaS Transactions & Revenue
  await testEndpoint('List SaaS Billing Transactions', 'GET', '/admin/transactions');

  // 5. Vendor Stores Management
  await testEndpoint('List Partner Stores / Vendors', 'GET', '/admin/vendors');

  // 6. KYC Verification Vault
  await testEndpoint('List Pending KYC Applications', 'GET', '/admin/kyc/pending');

  // 7. Super Admin Profile
  await testEndpoint('Get Super Admin Profile', 'GET', '/admin/profile');

  // 8. Notifications
  await testEndpoint('Get Broadcast Notifications', 'GET', '/notifications');

  console.log('\n====================================================');
  console.log(`AUDIT COMPLETE: ${results.filter(r => r.passed).length}/${results.length} ENDPOINTS PASSED`);
  console.log('====================================================');
}

runSuperAdminAudit().catch(console.error);
