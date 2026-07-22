const crypto = require('crypto');
const prisma = require('../src/config/db');

async function testTokenVerification() {
  console.log('[Test Verify] Testing token creation and lookup...');

  const token = crypto.randomBytes(32).toString('hex');
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const testEmail = 'verifytest@domain.com';

  // 1. Get or create test user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'testuser@domain.com',
        password: 'hash',
        name: 'Tester',
        plan: 'FAMILY',
      },
    });
  }

  // 2. Create Monitored Email
  const created = await prisma.monitoredEmail.create({
    data: {
      userId: user.id,
      email: testEmail,
      isVerified: false,
      verificationToken: token,
      tokenExpiresAt,
    },
  });

  console.log(`[Test Verify] Created record ID: ${created.id}`);
  console.log(`[Test Verify] Token stored: ${created.verificationToken}`);

  // 3. Query record
  const found = await prisma.monitoredEmail.findFirst({
    where: {
      email: testEmail.toLowerCase().trim(),
      verificationToken: token,
    },
  });

  console.log(`[Test Verify] Record found by token lookup:`, found ? 'YES' : 'NO');

  if (found) {
    console.log(`[Test Verify] Expired check: ${found.tokenExpiresAt < new Date() ? 'EXPIRED' : 'VALID'}`);
    
    // Clean up
    await prisma.monitoredEmail.delete({ where: { id: found.id } });
  }

  await prisma.$disconnect();
}

testTokenVerification();
