const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://breach_user:breach_password@localhost:5432/breachalert_db?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_breachalert_jwt_key_32_bytes_min_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  hibpApiKey: process.env.HIBP_API_KEY || 'mock',
  hibpUserAgent: process.env.HIBP_USER_AGENT || 'BreachAlert-DataBreachMonitor/1.0',
  emailFrom: process.env.EMAIL_FROM || 'no-reply@breachalert.io',
  emailFromName: process.env.EMAIL_FROM_NAME || 'BreachAlert Security Team',
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  get isSmtpConfigured() {
    return Boolean(this.sendgridApiKey && this.sendgridApiKey.startsWith('SG.')) ||
           Boolean(this.smtp.host && this.smtp.user && this.smtp.pass);
  },
};

module.exports = config;
