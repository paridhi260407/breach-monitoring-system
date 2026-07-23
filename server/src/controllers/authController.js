const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const config = require('../config/env');
const emailService = require('../services/emailService');

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email, password, and full name.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
        plan: 'FREE',
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true,
      },
    });

    // Generate email verification token for user's primary email address
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const monitoredEmail = await prisma.monitoredEmail.create({
      data: {
        userId: newUser.id,
        email: normalizedEmail,
        isVerified: false,
        verificationToken,
        tokenExpiresAt,
      },
    });

    // Send verification email to the user's registered email address
    const mailRes = await emailService.sendVerificationEmail(normalizedEmail, verificationToken, req);

    const token = generateToken(newUser.id);

    const responsePayload = {
      success: true,
      message: 'Account registered successfully. Verification email sent.',
      token,
      user: newUser,
      monitoredEmail: {
        id: monitoredEmail.id,
        email: monitoredEmail.email,
        isVerified: monitoredEmail.isVerified,
      },
    };

    if (mailRes?.isDevSimulated && mailRes?.verifyUrl) {
      responsePayload.verificationUrl = mailRes.verifyUrl;
    }

    return res.status(201).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials.',
      });
    }

    const token = generateToken(user.id);

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true,
        monitoredEmails: {
          select: {
            id: true,
            email: true,
            isVerified: true,
            lastScannedAt: true,
            createdAt: true,
            _count: {
              select: { breaches: true },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
