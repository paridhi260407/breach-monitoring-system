const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

async function seed() {
  console.log('[Seed] Seeding sample data into BreachAlert database...');

  try {
    // 1. Create Demo User
    const existingDemo = await prisma.user.findUnique({
      where: { email: 'demo@breachalert.io' },
    });

    if (!existingDemo) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Password123!', salt);

      const demoUser = await prisma.user.create({
        data: {
          email: 'demo@breachalert.io',
          password: hashedPassword,
          name: 'Security Researcher',
          plan: 'FAMILY',
        },
      });

      console.log(`[Seed] Created Demo User: ${demoUser.email} (Plan: ${demoUser.plan})`);

      // 2. Add Monitored Email
      const emailRecord = await prisma.monitoredEmail.create({
        data: {
          userId: demoUser.id,
          email: 'demo@breachalert.io',
          isVerified: true,
          lastScannedAt: new Date(),
        },
      });

      // 3. Add Sample Breach Records
      await prisma.breachRecord.createMany({
        data: [
          {
            monitoredEmailId: emailRecord.id,
            breachName: 'CanvaDataBreach',
            title: 'Canva Security Incident',
            domain: 'canva.com',
            breachDate: new Date('2019-05-24'),
            addedDate: new Date('2019-05-28'),
            description: 'In May 2019, graphic design tool Canva suffered a data breach impacting 137 million subscribers. Leaked data included email addresses, usernames, real names, geographic locations, and salted password hashes.',
            dataClasses: JSON.stringify(['Email addresses', 'Usernames', 'Names', 'Passwords', 'Geographic locations']),
            severity: 'HIGH',
            logoPath: 'https://haveibeenpwned.com/Content/Images/PwnedLogos/Canva.png',
          },
          {
            monitoredEmailId: emailRecord.id,
            breachName: 'AdobeSecurityIncident',
            title: 'Adobe Systems Breach',
            domain: 'adobe.com',
            breachDate: new Date('2013-10-04'),
            addedDate: new Date('2013-12-04'),
            description: 'In October 2013, 153 million Adobe accounts were compromised. Data included internal user IDs, names, encrypted credit card numbers, expiration dates, and password hints.',
            dataClasses: JSON.stringify(['Credit cards', 'Email addresses', 'Password hints', 'Passwords', 'Usernames']),
            severity: 'CRITICAL',
            logoPath: 'https://haveibeenpwned.com/Content/Images/PwnedLogos/Adobe.png',
          },
        ],
      });

      console.log('[Seed] Added sample monitored email and breach records.');
    } else {
      console.log('[Seed] Demo user already exists.');
    }

    console.log('[Seed] Completed successfully.');
  } catch (error) {
    console.error('[Seed Error]:', error);
  }
}

if (require.main === module) {
  seed().then(async () => {
    await prisma.$disconnect();
  });
}

module.exports = seed;

