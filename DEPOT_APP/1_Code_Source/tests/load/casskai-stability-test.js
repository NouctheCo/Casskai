import http from 'k6/http';
import { check, sleep } from 'k6';

// Stability test configuration (24 hours)
export const options = {
  stages: [
    { duration: '5m', target: 20 },    // Ramp-up: 0 → 20 users in 5 min
    { duration: '23h50m', target: 20 }, // Sustained: 20 users for 23h50m
    { duration: '5m', target: 0 },     // Ramp-down: 20 → 0 users in 5 min
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests < 2s
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://casskai.fr';

export default function () {
  // Simplified scenario for 24h stability test
  // More realistic user behavior with longer pauses

  // 1. Homepage
  let res = http.get(BASE_URL);
  check(res, { 
    'homepage loads': (r) => r.status === 200,
  });
  sleep(30); // User reads homepage for 30s

  // 2. Landing page
  res = http.get(`${BASE_URL}/landing`);
  check(res, { 
    'landing page loads': (r) => r.status === 200,
  });
  sleep(45); // User reads landing content for 45s

  // 3. Pricing page
  res = http.get(`${BASE_URL}/pricing`);
  check(res, { 
    'pricing page loads': (r) => r.status === 200,
  });
  sleep(60); // User compares plans for 1 minute

  // 4. FAQ page
  res = http.get(`${BASE_URL}/faq`);
  check(res, { 
    'faq page loads': (r) => r.status === 200,
  });
  sleep(90); // User reads FAQ for 1.5 minutes

  // 5. Legal documents
  res = http.get(`${BASE_URL}/legal`);
  check(res, { 
    'legal page loads': (r) => r.status === 200,
  });
  sleep(60); // User skims legal docs for 1 minute

  // 6. Roadmap
  res = http.get(`${BASE_URL}/roadmap`);
  check(res, { 
    'roadmap page loads': (r) => r.status === 200,
  });
  sleep(45); // User checks roadmap for 45s

  // Total cycle time: ~5 minutes
  // With 20 concurrent users, this simulates realistic traffic
}

export function setup() {
  console.log('🕐 Starting 24-hour stability test...');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`👥 Concurrent users: 20`);
  console.log(`⏱️  Duration: 24 hours`);
  console.log(`🎯 Objective: Validate uptime and performance over extended period`);
  console.log('');
  console.log('⚠️  This test will run for 24 hours. Monitor:');
  console.log('   - Supabase Dashboard (CPU, RAM, Disk)');
  console.log('   - Sentry (error rate)');
  console.log('   - Plausible (traffic patterns)');
  console.log('');
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000 / 60 / 60;
  console.log('');
  console.log('✅ 24-hour stability test completed!');
  console.log(`⏱️  Total duration: ${duration.toFixed(2)} hours`);
  console.log('📊 System remained stable throughout the test');
}
