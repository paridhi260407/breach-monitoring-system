const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../src/config/env');
const hibpService = require('../src/services/hibpService');
const { calculateSeverity } = require('../src/services/hibpService');
const emailService = require('../src/services/emailService');
const { PLAN_LIMITS } = require('../src/middleware/planMiddleware');

async function runAllTests() {
  console.log('====================================================');
  console.log('⚡ STARTING BREACHALERT COMPLETE FUNCTIONALITY TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Password Hashing & Verification (Bcrypt)
  console.log('[Test Suite 1/6] Password Security (bcryptjs)');
  try {
    const rawPass = 'SuperSecretPass123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPass, salt);
    assert(hash && hash !== rawPass, 'Password successfully hashed with bcrypt');

    const isValid = await bcrypt.compare(rawPass, hash);
    assert(isValid === true, 'Correct password verification succeeded');

    const isInvalid = await bcrypt.compare('WrongPassword!', hash);
    assert(isInvalid === false, 'Incorrect password correctly rejected');
  } catch (err) {
    assert(false, `Bcrypt test error: ${err.message}`);
  }

  // TEST 2: JWT Token Signing & Verification
  console.log('\n[Test Suite 2/6] Authentication (JWT Token Flow)');
  try {
    const testUserId = 'user-uuid-12345';
    const token = jwt.sign({ userId: testUserId }, config.jwtSecret, { expiresIn: '1h' });
    assert(typeof token === 'string' && token.length > 20, 'JWT token successfully signed');

    const decoded = jwt.verify(token, config.jwtSecret);
    assert(decoded.userId === testUserId, 'JWT payload correctly decoded and verified');
  } catch (err) {
    assert(false, `JWT test error: ${err.message}`);
  }

  // TEST 3: HIBP Severity Heuristic Algorithm
  console.log('\n[Test Suite 3/6] HIBP Severity Heuristic Engine');
  try {
    const criticalSev = calculateSeverity(['Passwords', 'Credit cards', 'Usernames']);
    assert(criticalSev === 'CRITICAL', 'Passwords + Credit cards categorized as CRITICAL');

    const highSev = calculateSeverity(['Password hashes', 'Job titles']);
    assert(highSev === 'HIGH', 'Password hashes categorized as HIGH');

    const mediumSev = calculateSeverity(['Phone numbers', 'IP addresses', 'Dates of birth']);
    assert(mediumSev === 'MEDIUM', 'Phone numbers & IP addresses categorized as MEDIUM');

    const lowSev = calculateSeverity(['User preferences', 'Avatar image']);
    assert(lowSev === 'LOW', 'Generic info categorized as LOW');
  } catch (err) {
    assert(false, `Severity test error: ${err.message}`);
  }

  // TEST 4: Have I Been Pwned API & Mock Service Integration
  console.log('\n[Test Suite 4/6] Have I Been Pwned (HIBP) Service');
  try {
    const mockEmail = 'testuser@breachalert.io';
    const breaches = await hibpService.getBreachesForEmail(mockEmail);
    assert(Array.isArray(breaches), 'HIBP service returns an array of breach records');
    assert(breaches.length > 0, `Mock HIBP returned ${breaches.length} breach record(s) for email`);
    
    if (breaches.length > 0) {
      const b = breaches[0];
      assert(b.breachName && b.title && b.severity, `Breach object contains name (${b.breachName}), title (${b.title}), and severity (${b.severity})`);
    }

    // Test safe email mock behavior
    const safeBreaches = await hibpService.getBreachesForEmail('clean@safe.com');
    assert(Array.isArray(safeBreaches) && safeBreaches.length === 0, 'Safe email returns 0 breaches as expected');
  } catch (err) {
    assert(false, `HIBP service test error: ${err.message}`);
  }

  // TEST 5: Email Notification Dispatcher
  console.log('\n[Test Suite 5/6] Email Service (SendGrid & SMTP Fallback)');
  try {
    const mockVerifyToken = 'token_abc123xyz456';
    const emailResult = await emailService.sendVerificationEmail('test@example.com', mockVerifyToken);
    assert(emailResult !== undefined, 'Verification email dispatch function executed cleanly');

    const alertResult = await emailService.sendBreachAlertEmail('user@example.com', 'monitored@example.com', [
      {
        title: 'Test Incident',
        breachName: 'TestBreach',
        severity: 'CRITICAL',
        description: 'Test breach description',
        dataClasses: ['Passwords', 'Credit cards'],
        breachDate: new Date(),
      },
    ]);
    assert(alertResult !== undefined, 'Breach alert notification email dispatch function executed cleanly');
  } catch (err) {
    assert(false, `Email service test error: ${err.message}`);
  }

  // TEST 6: Subscription Plan Limits Configuration
  console.log('\n[Test Suite 6/6] Subscription Plan Tier Restrictions');
  try {
    assert(PLAN_LIMITS.FREE === 1, 'Free tier correctly configured to max 1 email');
    assert(PLAN_LIMITS.FAMILY === 5, 'Family tier correctly configured to max 5 emails');
  } catch (err) {
    assert(false, `Subscription plan test error: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
