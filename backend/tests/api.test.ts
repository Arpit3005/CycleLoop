const BASE_URL = 'http://localhost:5000/api';

async function request(path: string, options: any = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

async function runTests() {
  console.log('🧪 Starting CycleLoop API Integration Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Health check
  const health = await request('/health');
  assert(health.ok && health.data.status === 'healthy', 'Health check responds with healthy status');

  // 2. Student Login
  const studentLoginRes = await request('/auth/student/login', {
    method: 'POST',
    body: { identifier: 'aarav@campuscycle.edu', password: 'Student@123' }
  });
  assert(studentLoginRes.ok && Boolean(studentLoginRes.data.token), 'Student logs in with email and receives JWT');
  const studentToken = studentLoginRes.data.token;

  // 3. Admin Login
  const adminLoginRes = await request('/auth/admin/login', {
    method: 'POST',
    body: { email: 'admin@campuscycle.edu', password: 'Admin@123' }
  });
  assert(adminLoginRes.ok && Boolean(adminLoginRes.data.token), 'Admin logs in and receives JWT');
  const adminToken = adminLoginRes.data.token;

  // 4. Student identify bicycle CYC-001
  const identifyRes = await request('/bicycles/identify/CYC-001', { token: studentToken });
  assert(identifyRes.ok && identifyRes.data.bicycle.bicycleCode === 'CYC-001', 'Identify bicycle CYC-001 by code');
  const cyc001Token = identifyRes.data.bicycle.qrToken;

  // 5. Start rental for CYC-001
  const startRes = await request('/rentals/start', {
    method: 'POST',
    token: studentToken,
    body: { qrTokenOrCode: cyc001Token }
  });
  assert(startRes.ok && startRes.data.rental.bicycleCode === 'CYC-001', 'Start rental for CYC-001 succeeds');
  const rentalId = startRes.data.rental.id;

  // 6. Active rental check
  const activeRes = await request('/rentals/active', { token: studentToken });
  assert(activeRes.ok && activeRes.data.active === true && activeRes.data.rental.id === rentalId, 'Active rental endpoint returns currently rented bicycle');

  // 7. Prevent concurrent duplicate rental by same student
  const dupRentalRes = await request('/rentals/start', {
    method: 'POST',
    token: studentToken,
    body: { qrTokenOrCode: 'CYC-002' }
  });
  assert(dupRentalRes.status === 400, 'Student cannot rent multiple bicycles concurrently');

  // 8. Prevent another student from renting the already rented CYC-001
  const priyaLoginRes = await request('/auth/student/login', {
    method: 'POST',
    body: { identifier: 'priya@campuscycle.edu', password: 'Student@123' }
  });
  const priyaToken = priyaLoginRes.data.token;
  const priyaRentConflict = await request('/rentals/start', {
    method: 'POST',
    token: priyaToken,
    body: { qrTokenOrCode: cyc001Token }
  });
  assert(priyaRentConflict.status === 409, 'Another student cannot rent currently rented bicycle');

  // 9. Prevent mismatched return (Priya trying to return Aarav\'s bike or Aarav scanning wrong bike)
  const wrongBikeReturn = await request('/rentals/return', {
    method: 'POST',
    token: studentToken,
    body: { qrTokenOrCode: 'CYC-002' }
  });
  assert(wrongBikeReturn.status === 400, 'Mismatched bicycle scan rejected during return');

  // 10. Successful Return
  const returnRes = await request('/rentals/return', {
    method: 'POST',
    token: studentToken,
    body: { qrTokenOrCode: cyc001Token }
  });
  assert(returnRes.ok && returnRes.data.summary.finalAmount > 0, `Rental returned with authoritative fare: ₹${returnRes.data.summary?.finalAmount}`);
  const paymentOrderId = returnRes.data.summary.payment.orderId;

  // 11. Complete Payment (Simulated verification)
  const payVerifyRes = await request('/payments/verify', {
    method: 'POST',
    token: studentToken,
    body: {
      orderId: paymentOrderId,
      paymentId: `sim_pay_${Date.now()}`,
      method: 'UPI'
    }
  });
  assert(payVerifyRes.ok && payVerifyRes.data.receipt.status === 'SUCCESS', 'Payment successfully verified and status set to SUCCESS');

  // 12. Verify CYC-001 is AVAILABLE again
  const bikeAvailableAgain = await request('/bicycles/available');
  const isCyc1Available = bikeAvailableAgain.data.bicycles.some((b: any) => b.bicycleCode === 'CYC-001');
  assert(isCyc1Available, 'CYC-001 restored to AVAILABLE status after rental completion');

  // 13. Admin Dashboard stats
  const adminStats = await request('/admin/dashboard', { token: adminToken });
  assert(adminStats.ok && adminStats.data.stats.totalRevenue > 0, `Admin stats returns total revenue: ₹${adminStats.data.stats.totalRevenue}`);

  // 14. Admin Analytics
  const adminAnalytics = await request('/admin/analytics', { token: adminToken });
  assert(adminAnalytics.ok && Array.isArray(adminAnalytics.data.chartData), 'Admin analytics returns 7-day chart series');

  console.log(`\n=========================================`);
  console.log(`Total Passed: ${passed} | Failed: ${failed}`);
  console.log(`=========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
