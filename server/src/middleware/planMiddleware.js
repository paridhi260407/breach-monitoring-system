const prisma = require('../config/db');

const PLAN_LIMITS = {
  FREE: 1,
  FAMILY: 5,
};

/**
  Check if user can add another monitored email address based on current plan tier
 */
const checkEmailLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const plan = req.user.plan || 'FREE';
    const limit = PLAN_LIMITS[plan] || 1;

    const currentCount = await prisma.monitoredEmail.count({
      where: { userId },
    });

    if (currentCount >= limit) {
      return res.status(403).json({
        success: false,
        error: `Plan limit reached. Your ${plan} tier allows up to ${limit} monitored email address(es). Please upgrade to the Family Plan for more slots.`,
        code: 'PLAN_LIMIT_REACHED',
        currentCount,
        limit,
        plan,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { checkEmailLimit, PLAN_LIMITS };
