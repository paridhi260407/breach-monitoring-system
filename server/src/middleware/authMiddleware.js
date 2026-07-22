const jwt = require('jsonwebtoken');
const config = require('../config/env');
const prisma = require('../config/db');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Authentication token missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, plan: true, createdAt: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. User account not found.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Authentication token expired. Please log in again.',
      });
    }
    return res.status(403).json({
      success: false,
      error: 'Invalid authentication token.',
    });
  }
};

module.exports = { authenticateToken };
