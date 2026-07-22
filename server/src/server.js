const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const { isRedisConnected } = require('./config/redis');
const schedulerService = require('./services/schedulerService');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const emailRoutes = require('./routes/emailRoutes');
const breachRoutes = require('./routes/breachRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

const app = express();

// 1. Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: config.nodeEnv === 'production',
    crossOriginEmbedderPolicy: config.nodeEnv === 'production',
  })
);

// 2. CORS Configuration
const allowedOrigins = [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body Parsing with payload size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. System Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    redis: isRedisConnected() ? 'connected' : 'in-memory-fallback',
    environment: config.nodeEnv,
    hibpMode: config.hibpApiKey === 'mock' ? 'mock' : 'live-api',
  });
});

// 5. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/breaches', breachRoutes);
app.use('/api/subscription', subscriptionRoutes);

// 6. Error & Not Found Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// 7. Start Cron Job Scheduler
schedulerService.init();

// 8. Start HTTP Server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║ ⚡ BREACHALERT BACKEND SECURITY SERVICE STARTED              ║
║ 🚀 Listening on: http://localhost:${PORT}                    ║
║ 🔒 Environment: ${config.nodeEnv.padEnd(28, ' ')}             ║
║ 🛡️ HIBP Mode:   ${(config.hibpApiKey === 'mock' ? 'Mock Fallback Mode' : 'Live HIBP API Key').padEnd(28, ' ')} ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
