const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const config = require('./config/env');
const { isRedisConnected } = require('./config/redis');
const schedulerService = require('./services/schedulerService');
const seed = require('./utils/seed');
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
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS Configuration
const allowedOrigins = [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, postman) or matching allowed origins / .onrender.com
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.onrender.com') ||
        config.nodeEnv === 'development'
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Blocked by CORS policy: ${origin}`));
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

// 6. Serve static client assets if client/dist exists (Fullstack Single-Service Deployment)
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Static Assets]: Serving frontend static files from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
} else {
  console.warn(`[Static Assets Warning]: Client build not found at ${clientDistPath}. Running in API-only mode.`);
  // Root route handler for API-only backend deployments
  app.get('/', (req, res) => {
    res.status(200).json({
      status: 'online',
      message: '⚡ BreachAlert Security API Server is running',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        emails: '/api/emails',
        breaches: '/api/breaches',
        subscription: '/api/subscription',
      },
    });
  });
}

// 7. Error & Not Found Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// 8. Start Cron Job Scheduler
schedulerService.init();

// 9. Start HTTP Server and Run Database Auto-Seeding
const PORT = config.port;
app.listen(PORT, async () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║ ⚡ BREACHALERT BACKEND SECURITY SERVICE STARTED              ║
║ 🚀 Listening on: http://localhost:${PORT}                    ║
║ 🔒 Environment: ${config.nodeEnv.padEnd(28, ' ')}             ║
║ 🛡️ HIBP Mode:   ${(config.hibpApiKey === 'mock' ? 'Mock Fallback Mode' : 'Live HIBP API Key').padEnd(28, ' ')} ║
╚══════════════════════════════════════════════════════════════╝
  `);

  try {
    await seed();
  } catch (err) {
    console.error('[Startup Seed Warning]:', err.message);
  }
});

module.exports = app;

