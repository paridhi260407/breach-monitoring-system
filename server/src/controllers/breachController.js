const prisma = require('../config/db');
const hibpService = require('../services/hibpService');
const emailService = require('../services/emailService');

/**
 * Trigger manual breach scan for a specific monitored email
 */
const scanEmail = async (req, res, next) => {
  try {
    const { emailId } = req.body;

    if (!emailId) {
      return res.status(400).json({
        success: false,
        error: 'Email ID is required.',
      });
    }

    const monitoredEmail = await prisma.monitoredEmail.findFirst({
      where: { id: emailId, userId: req.user.id },
      include: { breaches: true },
    });

    if (!monitoredEmail) {
      return res.status(404).json({
        success: false,
        error: 'Monitored email address not found.',
      });
    }

    if (!monitoredEmail.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email address must be verified before performing breach scans.',
      });
    }

    console.log(`[Breach Controller] Manual scan requested for: ${monitoredEmail.email}`);

    // Call HIBP Service (uses Redis caching automatically)
    const hibpBreaches = await hibpService.getBreachesForEmail(monitoredEmail.email);
    const existingBreachNames = new Set(monitoredEmail.breaches.map((b) => b.breachName));

    const newlyDiscovered = [];

    for (const rawBreach of hibpBreaches) {
      if (!existingBreachNames.has(rawBreach.breachName)) {
        const created = await prisma.breachRecord.create({
          data: {
            monitoredEmailId: monitoredEmail.id,
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

    // Update last scanned timestamp
    await prisma.monitoredEmail.update({
      where: { id: monitoredEmail.id },
      data: { lastScannedAt: new Date() },
    });

    // Send email notification if new breaches were found
    if (newlyDiscovered.length > 0) {
      await emailService.sendBreachAlertEmail(req.user.email, monitoredEmail.email, newlyDiscovered);
    }

    // Fetch all current breaches after scan
    const allBreaches = await prisma.breachRecord.findMany({
      where: { monitoredEmailId: monitoredEmail.id },
      orderBy: { breachDate: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: `Scan complete for ${monitoredEmail.email}. ${newlyDiscovered.length} new breach(es) detected.`,
      newBreachesCount: newlyDiscovered.length,
      totalBreachesCount: allBreaches.length,
      breaches: allBreaches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get aggregated breach history across all monitored emails for user
 */
const getBreachHistory = async (req, res, next) => {
  try {
    const { severity, search } = req.query;

    const monitoredEmails = await prisma.monitoredEmail.findMany({
      where: { userId: req.user.id },
      select: { id: true, email: true },
    });

    const emailIds = monitoredEmails.map((e) => e.id);
    const emailMap = Object.fromEntries(monitoredEmails.map((e) => [e.id, e.email]));

    if (emailIds.length === 0) {
      return res.status(200).json({
        success: true,
        breaches: [],
      });
    }

    const whereClause = {
      monitoredEmailId: { in: emailIds },
    };

    if (severity) {
      whereClause.severity = severity.toUpperCase();
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { breachName: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const breaches = await prisma.breachRecord.findMany({
      where: whereClause,
      orderBy: { breachDate: 'desc' },
    });

    const breachesWithEmail = breaches.map((b) => ({
      ...b,
      dataClasses: typeof b.dataClasses === 'string' ? JSON.parse(b.dataClasses || '[]') : b.dataClasses,
      monitoredEmail: emailMap[b.monitoredEmailId] || 'Unknown',
    }));

    return res.status(200).json({
      success: true,
      breaches: breachesWithEmail,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard security metrics summary
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const monitoredEmails = await prisma.monitoredEmail.findMany({
      where: { userId: req.user.id },
      include: {
        breaches: true,
      },
    });

    let totalMonitored = monitoredEmails.length;
    let verifiedCount = monitoredEmails.filter((e) => e.isVerified).length;
    let totalBreaches = 0;
    let criticalBreaches = 0;
    let highBreaches = 0;
    let compromisedEmails = 0;
    let lastScanTime = null;

    monitoredEmails.forEach((emailItem) => {
      if (emailItem.breaches.length > 0) {
        compromisedEmails++;
        totalBreaches += emailItem.breaches.length;
      }
      emailItem.breaches.forEach((b) => {
        if (b.severity === 'CRITICAL') criticalBreaches++;
        if (b.severity === 'HIGH') highBreaches++;
      });
      if (emailItem.lastScannedAt) {
        if (!lastScanTime || new Date(emailItem.lastScannedAt) > new Date(lastScanTime)) {
          lastScanTime = emailItem.lastScannedAt;
        }
      }
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalMonitored,
        verifiedCount,
        compromisedEmails,
        totalBreaches,
        criticalBreaches,
        highBreaches,
        lastScanTime,
        userPlan: req.user.plan,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanEmail,
  getBreachHistory,
  getDashboardStats,
};
