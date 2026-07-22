const cron = require('node-cron');
const prisma = require('../config/db');
const hibpService = require('./hibpService');
const emailService = require('./emailService');

class SchedulerService {
  init() {
    // Schedule nightly scan at 02:00 AM every night ("0 2 * * *")
    console.log('[Scheduler] Initializing automated background scan cron job (0 2 * * *)...');
    
    cron.schedule('0 2 * * *', async () => {
      console.log('[Cron Job] Starting nightly automated breach scan execution...');
      await this.runAutomatedBreachScan();
    });

    console.log('[Scheduler] Cron job active.');
  }

  /**
   * Run automated scan across all verified monitored emails
   */
  async runAutomatedBreachScan() {
    try {
      // Fetch verified emails for users with FAMILY plan (or all verified emails in active tier)
      const verifiedEmails = await prisma.monitoredEmail.findMany({
        where: {
          isVerified: true,
          user: {
            plan: 'FAMILY', // Automated nightly scans active for FAMILY plan subscribers
          },
        },
        include: {
          user: true,
          breaches: true,
        },
      });

      console.log(`[Cron Job] Found ${verifiedEmails.length} verified emails scheduled for automated scanning.`);

      for (const item of verifiedEmails) {
        try {
          console.log(`[Cron Job] Scanning email: ${item.email} (User: ${item.user.email})...`);
          
          const hibpBreaches = await hibpService.getBreachesForEmail(item.email);
          const existingBreachNames = new Set(item.breaches.map((b) => b.breachName));

          const newlyDiscovered = [];

          for (const rawBreach of hibpBreaches) {
            if (!existingBreachNames.has(rawBreach.breachName)) {
              // Create new record in DB
              const created = await prisma.breachRecord.create({
                data: {
                  monitoredEmailId: item.id,
                  breachName: rawBreach.breachName,
                  title: rawBreach.title,
                  domain: rawBreach.domain,
                  breachDate: rawBreach.breachDate,
                  addedDate: rawBreach.addedDate,
                  description: rawBreach.description,
                  dataClasses: JSON.stringify(rawBreach.dataClasses || []),
                  isVerified: rawBreach.isVerified,
                  isFabricated: rawBreach.isFabricated,
                  isSensitive: rawBreach.isSensitive,
                  logoPath: rawBreach.logoPath,
                  severity: rawBreach.severity,
                },
              });
              newlyDiscovered.push(created);
            }
          }

          // Update lastScannedAt timestamp
          await prisma.monitoredEmail.update({
            where: { id: item.id },
            data: { lastScannedAt: new Date() },
          });

          // Send email notification if new breaches were found
          if (newlyDiscovered.length > 0) {
            console.log(`[Cron Job] 🚨 Found ${newlyDiscovered.length} NEW breach(es) for ${item.email}. Dispatching alert!`);
            await emailService.sendBreachAlertEmail(item.user.email, item.email, newlyDiscovered);
          } else {
            console.log(`[Cron Job] Clean scan for ${item.email} - no new breaches detected.`);
          }
        } catch (scanErr) {
          console.error(`[Cron Job Error] Failed to scan email ${item.email}:`, scanErr.message);
        }
      }

      console.log('[Cron Job] Nightly automated breach scan process complete.');
    } catch (error) {
      console.error('[Cron Job Fatal Error]:', error.message);
    }
  }
}

module.exports = new SchedulerService();
