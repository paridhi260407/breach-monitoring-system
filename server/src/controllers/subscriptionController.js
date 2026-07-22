const prisma = require('../config/db');

/**
 * Upgrade or change user subscription plan (Free <-> Family)
 */
const updateSubscription = async (req, res, next) => {
  try {
    const { plan } = req.body;

    if (!plan || !['FREE', 'FAMILY'].includes(plan.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan choice. Must be FREE or FAMILY.',
      });
    }

    const newPlan = plan.toUpperCase();

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { plan: newPlan },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Subscription plan updated to ${newPlan} tier successfully.`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { updateSubscription };
