const express = require('express');
const { updateSubscription } = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticateToken);

router.post('/upgrade', apiLimiter, updateSubscription);

module.exports = router;
