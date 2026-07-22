const express = require('express');
const { body } = require('express-validator');
const {
  addMonitoredEmail,
  verifyEmail,
  resendVerification,
  getMonitoredEmails,
  deleteMonitoredEmail,
} = require('../controllers/emailController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkEmailLimit } = require('../middleware/planMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public endpoint to process verification links from email
router.get('/verify', verifyEmail);

// Protected endpoints
router.use(authenticateToken);

router.get('/', getMonitoredEmails);

router.post(
  '/',
  apiLimiter,
  checkEmailLimit,
  [body('email').isEmail().withMessage('Please provide a valid email address to monitor.').normalizeEmail()],
  addMonitoredEmail
);

router.post('/resend-verification', apiLimiter, resendVerification);

router.delete('/:id', deleteMonitoredEmail);

module.exports = router;
