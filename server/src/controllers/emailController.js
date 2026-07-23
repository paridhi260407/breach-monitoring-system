const crypto = require('crypto');
const prisma = require('../config/db');
const emailService = require('../services/emailService');
const config = require('../config/env');

/**
 * Add a new email address for breach monitoring
 */
const addMonitoredEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const userId = req.user.id;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate for this specific user
    const existing = await prisma.monitoredEmail.findFirst({
      where: { userId, email: normalizedEmail },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'You are already monitoring this email address.',
      });
    }

    // Generate email verification token (expires in 24 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const monitoredEmail = await prisma.monitoredEmail.create({
      data: {
        userId,
        email: normalizedEmail,
        isVerified: false,
        verificationToken,
        tokenExpiresAt,
      },
    });

    // Send verification email to user-entered recipient
    const mailRes = await emailService.sendVerificationEmail(normalizedEmail, verificationToken, req);

    const responsePayload = {
      success: true,
      message: mailRes?.isDevSimulated
        ? 'Monitored email added. Dev link generated (SMTP missing).'
        : `Monitored email added. Verification email dispatched to ${normalizedEmail}.`,
      monitoredEmail: {
        id: monitoredEmail.id,
        email: monitoredEmail.email,
        isVerified: monitoredEmail.isVerified,
        createdAt: monitoredEmail.createdAt,
      },
    };

    // Remove dev link flow when SMTP credentials are available
    if (mailRes?.isDevSimulated && mailRes?.verifyUrl) {
      responsePayload.verificationUrl = mailRes.verifyUrl;
    }

    return res.status(201).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify ownership of a monitored email address
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token, email } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required.',
      });
    }

    const whereClause = { verificationToken: token };
    if (email) {
      whereClause.email = email.toLowerCase().trim();
    }

    const record = await prisma.monitoredEmail.findFirst({
      where: whereClause,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired verification token.',
      });
    }

    if (record.tokenExpiresAt && record.tokenExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Verification token has expired. Please request a new verification email.',
      });
    }

    const updated = await prisma.monitoredEmail.update({
      where: { id: record.id },
      data: {
        isVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Email address successfully verified! Automated breach monitoring is now ACTIVE.',
      email: updated.email,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend email verification link
 */
const resendVerification = async (req, res, next) => {
  try {
    const { emailId } = req.body;

    const record = await prisma.monitoredEmail.findFirst({
      where: { id: emailId, userId: req.user.id },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Monitored email not found.',
      });
    }

    if (record.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'This email address is already verified.',
      });
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.monitoredEmail.update({
      where: { id: record.id },
      data: {
        verificationToken: newToken,
        tokenExpiresAt,
      },
    });

    const mailRes = await emailService.sendVerificationEmail(record.email, newToken, req);

    const responsePayload = {
      success: true,
      message: mailRes?.isDevSimulated
        ? 'Verification link resent (Dev Simulation Mode).'
        : `Verification email dispatched to ${record.email}.`,
    };

    // Remove dev link flow when SMTP credentials are available
    if (mailRes?.isDevSimulated && mailRes?.verifyUrl) {
      responsePayload.verificationUrl = mailRes.verifyUrl;
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all monitored emails for the authenticated user
 */
const getMonitoredEmails = async (req, res, next) => {
  try {
    const emails = await prisma.monitoredEmail.findMany({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: { breaches: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      emails,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a monitored email address
 */
const deleteMonitoredEmail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await prisma.monitoredEmail.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Monitored email address not found.',
      });
    }

    await prisma.monitoredEmail.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Monitored email address deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addMonitoredEmail,
  verifyEmail,
  resendVerification,
  getMonitoredEmails,
  deleteMonitoredEmail,
};
