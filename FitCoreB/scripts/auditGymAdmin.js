require('dotenv').config();
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:7000/api/gym-admin';

async function runGymAdminAudit() {
  console.log('====================================================');
  console.log('⚡ STARTING GYM ADMIN FULL BACKEND & API AUDIT');
  console.log('====================================================\n');

  const token = jwt.sign(
    { id: '6a934afd13a1b16c3767d90e', role: 'admin', gymId: '6a934afd13a1b16c3767d90f' },
    process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production'
  );

  const gymId = '6a934afd13a1b16c3767d90f';
  const memberId = '6a935208ca5419e4a3426fea'; // Ankit Patil

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

  // 1. Overview & Stats
  await testEndpoint('Gym Overview Stats', 'GET', `/overview?gymId=${gymId}`);

  // 2. Attendance Ops
  await testEndpoint('Today Turnstile Attendance', 'GET', `/attendance/today?gymId=${gymId}`);
  await testEndpoint('Attendance Statistics', 'GET', `/attendance/stats?gymId=${gymId}`);
  await testEndpoint('Member 30-Day Timeline & Calendar', 'GET', `/attendance/timeline?gymId=${gymId}&memberId=${memberId}`);
  await testEndpoint('Monthly Attendance Audit Report', 'GET', `/attendance/report?gymId=${gymId}&month=9&year=2026`);

  // 3. Member Check-in / Checkout
  await testEndpoint('Member Check-in Action', 'POST', `/attendance/check-in`, {
    gymId,
    memberId,
    memberName: 'Ankit Patil'
  });
  await testEndpoint('Member Check-out Action', 'POST', `/attendance/check-out`, {
    gymId,
    memberId
  });

  // 4. Member Management
  await testEndpoint('Gym Members Roster', 'GET', `/members?gymId=${gymId}`);

  // 5. Trainer Desk
  await testEndpoint('Gym Trainers Roster', 'GET', `/trainers?gymId=${gymId}`);

  // 6. Membership Packages
  await testEndpoint('Gym Packages List', 'GET', `/packages?gymId=${gymId}`);

  // 7. KYC Compliance Vault
  await testEndpoint('Gym KYC Documents', 'GET', `/kyc?gymId=${gymId}`);

  // 8. Expenses Ledger
  await testEndpoint('Gym Monthly Expenses', 'GET', `/expenses?gymId=${gymId}&month=9&year=2026`);

  // 9. Notices & Notice Board
  await testEndpoint('Gym Broadcast Notices', 'GET', `/notices?gymId=${gymId}`);

  // 10. Holidays & Settings
  await testEndpoint('Gym Calendar Holidays', 'GET', `/holidays?gymId=${gymId}`);
  await testEndpoint('Gym Operational Settings', 'GET', `/settings?gymId=${gymId}`);

  console.log('\n====================================================');
  console.log(`AUDIT COMPLETE: ${results.filter(r => r.passed).length}/${results.length} GYM ADMIN ENDPOINTS PASSED`);
  console.log('====================================================');
}

runGymAdminAudit().catch(console.error);
