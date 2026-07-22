const express = require('express');
const { scanEmail, getBreachHistory, getDashboardStats } = require('../controllers/breachController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { scanLimiter, apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticateToken);

router.post('/scan', scanLimiter, scanEmail);
router.get('/history', apiLimiter, getBreachHistory);
router.get('/stats', apiLimiter, getDashboardStats);

module.exports = router;
