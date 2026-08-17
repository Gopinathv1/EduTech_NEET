/**
 * Load sanity check with k6 — verifies the catalogue, dashboard, and test engine
 * hold up under ~500 concurrent students and that pages stay under the 2s FRD
 * target (p95).
 *
 * Install k6 (https://k6.io/docs/get-started/installation/), then:
 *
 *   # Public pages only (no auth needed):
 *   BASE_URL=https://staging.example.in k6 run load/load-test.js
 *
 *   # Include the authenticated dashboard + catalogue + a test's start page:
 *   # grab a logged-in student's `session` cookie from the browser dev tools.
 *   BASE_URL=https://staging.example.in \
 *   SESSION_COOKIE=eyJ... \
 *   TEST_ID=<a-published-test-id> \
 *   k6 run load/load-test.js
 *
 * Run against STAGING, never production, and coordinate with the DB provider so
 * connection-pool limits are sized for the concurrency (see DEPLOYMENT.md).
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const SESSION_COOKIE = __ENV.SESSION_COOKIE || '';
const TEST_ID = __ENV.TEST_ID || '';

export const options = {
  scenarios: {
    students: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 500 }, // ramp up to 500 concurrent students
        { duration: '3m', target: 500 }, // hold
        { duration: '1m', target: 0 }, // ramp down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    // FRD success metric: pages under 2 seconds.
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'], // <1% errors
  },
};

const authParams = SESSION_COOKIE
  ? { headers: { Cookie: `session=${SESSION_COOKIE}` } }
  : {};

export default function () {
  group('public catalogue + marketing', () => {
    check(http.get(`${BASE_URL}/`), { 'home 200': (r) => r.status === 200 });
    check(http.get(`${BASE_URL}/mock-tests`), { 'mock-tests 200': (r) => r.status === 200 });
    check(http.get(`${BASE_URL}/api/health`), { 'health 200': (r) => r.status === 200 });
  });

  if (SESSION_COOKIE) {
    group('authenticated dashboard + catalogue', () => {
      check(http.get(`${BASE_URL}/student`, authParams), {
        'dashboard ok': (r) => r.status === 200,
      });
      check(http.get(`${BASE_URL}/student/tests`, authParams), {
        'catalogue ok': (r) => r.status === 200,
      });
      if (TEST_ID) {
        // Test-engine entry (instructions/start page) for a purchased test.
        check(http.get(`${BASE_URL}/student/tests/${TEST_ID}/start`, authParams), {
          'test start ok': (r) => r.status === 200 || r.status === 307,
        });
      }
    });
  }

  sleep(1); // model a student pausing between page views
}
