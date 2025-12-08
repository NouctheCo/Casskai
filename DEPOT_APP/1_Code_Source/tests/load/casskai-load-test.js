import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const loginSuccessRate = new Rate('login_success');
const dashboardLoadTime = new Trend('dashboard_load_time');
const invoiceCreationTime = new Trend('invoice_creation_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp-up: 0 → 10 users in 2min
    { duration: '3m', target: 30 },  // Ramp-up: 10 → 30 users in 3min
    { duration: '5m', target: 50 },  // Ramp-up: 30 → 50 users in 5min
    { duration: '10m', target: 50 }, // Sustained load: 50 users for 10min
    { duration: '2m', target: 0 },   // Ramp-down: 50 → 0 users in 2min
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% des requêtes < 2s
    http_req_failed: ['rate<0.01'],    // Taux d'erreur < 1%
    login_success: ['rate>0.95'],      // 95% de logins réussis
    dashboard_load_time: ['p(95)<1500'], // Dashboard < 1.5s
    invoice_creation_time: ['p(95)<3000'], // Invoice creation < 3s
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'https://casskai.fr';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'loadtest@casskai.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'LoadTest123!';

// Main test function
export default function () {
  // 1. Homepage load
  let res = http.get(BASE_URL);
  check(res, {
    'homepage loads': (r) => r.status === 200,
    'homepage has title': (r) => r.body.includes('CassKai'),
  });
  sleep(1);

  // 2. Login attempt
  res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginSuccess = check(res, {
    'login successful': (r) => r.status === 200 || r.status === 302,
  });
  loginSuccessRate.add(loginSuccess);

  if (!loginSuccess) {
    console.log(`Login failed: ${res.status} - ${res.body}`);
    return;
  }

  // Extract session cookie or token
  const cookies = res.cookies;
  let authHeaders = { headers: {} };
  
  if (res.json('access_token')) {
    authHeaders.headers['Authorization'] = `Bearer ${res.json('access_token')}`;
  }
  authHeaders.headers['Content-Type'] = 'application/json';

  sleep(1);

  // 3. Dashboard load
  const dashboardStart = Date.now();
  res = http.get(`${BASE_URL}/dashboard`, authHeaders);
  const dashboardTime = Date.now() - dashboardStart;
  dashboardLoadTime.add(dashboardTime);
  check(res, {
    'dashboard loads': (r) => r.status === 200,
    'dashboard < 2s': () => dashboardTime < 2000,
  });
  sleep(2);

  // 4. Accounting page
  res = http.get(`${BASE_URL}/accounting`, authHeaders);
  check(res, {
    'accounting page loads': (r) => r.status === 200,
  });
  sleep(2);

  // 5. Invoicing page
  res = http.get(`${BASE_URL}/invoicing`, authHeaders);
  check(res, {
    'invoicing page loads': (r) => r.status === 200,
  });
  sleep(2);

  // 6. Reports page
  res = http.get(`${BASE_URL}/reports`, authHeaders);
  check(res, {
    'reports page loads': (r) => r.status === 200,
  });
  sleep(2);

  // 7. Settings page
  res = http.get(`${BASE_URL}/settings`, authHeaders);
  check(res, {
    'settings page loads': (r) => r.status === 200,
  });
  sleep(1);
}

// Setup function (runs once at the beginning)
export function setup() {
  console.log('🚀 Starting CassKai load test...');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`👤 Test user: ${TEST_EMAIL}`);
  console.log(`⏱️  Duration: 22 minutes (ramp-up + sustained + ramp-down)`);
  console.log(`👥 Max users: 50 concurrent`);
  console.log('');
  return { startTime: Date.now() };
}

// Teardown function (runs once at the end)
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000 / 60;
  console.log('');
  console.log('✅ Load test completed!');
  console.log(`⏱️  Total duration: ${duration.toFixed(2)} minutes`);
  console.log('📊 Check results above for detailed metrics');
}
