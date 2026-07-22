const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const config = require('../config/env');

let useSendGrid = false;
let smtpTransporter = null;

// Initialize email transporter
async function initTransporter() {
  if (config.sendgridApiKey && config.sendgridApiKey.startsWith('SG.')) {
    sgMail.setApiKey(config.sendgridApiKey);
    useSendGrid = true;
    console.log('[Email Service] Configured with SendGrid API');
    return;
  }

  if (config.smtp.host && config.smtp.user && config.smtp.pass) {
    console.log(`[Email Service] Initializing SMTP Transporter (${config.smtp.host}:${config.smtp.port})...`);
    smtpTransporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    try {
      await smtpTransporter.verify();
      console.log(`[Email Service] SMTP Transporter connected & verified successfully (${config.smtp.host}:${config.smtp.port})`);
    } catch (err) {
      console.warn(`[Email Service] SMTP Transporter verification warning: ${err.message}. Will attempt delivery on request.`);
    }
    return;
  }

  console.warn('[Email Service] SMTP credentials missing. Email simulation mode active.');
}

initTransporter().catch((err) => console.error('[Email Service Init Error]:', err.message));

class EmailService {
  /**
   * Send mail using configured transport (SendGrid, SMTP, or Simulation fallback) with retry logic
   */
  async sendMail({ to, subject, html, text }) {
    // Sender must always be process.env.EMAIL_FROM
    const from = process.env.EMAIL_FROM || config.emailFrom;
    const maxRetries = 3;

    if (useSendGrid) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await sgMail.send({ to, from, subject, html, text });
          console.log(`[Email Service] SendGrid email successfully delivered to: ${to} (Attempt ${attempt})`);
          return { success: true, provider: 'SendGrid', isDevSimulated: false };
        } catch (error) {
          console.error(`[Email Service] SendGrid delivery attempt ${attempt}/${maxRetries} failed to ${to}:`, error.message);
          if (attempt === maxRetries) {
            throw new Error(`SendGrid email delivery failed after ${maxRetries} attempts: ${error.message}`);
          }
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    if (smtpTransporter) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const info = await smtpTransporter.sendMail({ from, to, subject, html, text });
          console.log(`[Email Service] SMTP email successfully delivered to: ${to} (MessageId: ${info.messageId}, Attempt ${attempt})`);
          return { success: true, provider: 'SMTP', isDevSimulated: false, messageId: info.messageId };
        } catch (error) {
          console.error(`[Email Service] SMTP delivery attempt ${attempt}/${maxRetries} failed to ${to}:`, error.message);
          if (attempt === maxRetries) {
            throw new Error(`SMTP email delivery failed after ${maxRetries} attempts: ${error.message}`);
          }
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    // Simulation mode when SMTP credentials are missing
    console.warn(`[Email Service] Simulation Mode: Email simulated for recipient: ${to} ("${subject}")`);
    return { success: true, provider: 'Simulation', isDevSimulated: true };
  }

  /**
   * Send verification email containing a secure verification link
   */
  async sendVerificationEmail(email, token) {
    const verifyUrl = `${config.clientUrl}/verify?token=${token}`;
    const subject = '🔒 Verify Your Email Address - BreachAlert';
    const text = `Please verify your email address to enable BreachAlert monitoring: ${verifyUrl}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 580px; margin: 40px auto; background-color: #111827; border-radius: 16px; border: 1px solid #1e293b; padding: 36px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #1e293b; }
          .logo { font-size: 26px; font-weight: 900; color: #38bdf8; letter-spacing: -0.5px; text-decoration: none; }
          .badge { display: inline-block; background-color: #0c4a6e; color: #38bdf8; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; margin-top: 8px; }
          .content { padding: 28px 0; }
          .title { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; line-height: 1.3; }
          .text { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%); color: #090d16 !important; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 15px; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(6, 182, 212, 0.3); }
          .btn:hover { opacity: 0.95; }
          .link-box { background-color: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 12px 16px; word-break: break-all; color: #38bdf8; font-size: 13px; font-family: monospace; margin-top: 16px; }
          .footer { padding-top: 24px; border-top: 1px solid #1e293b; color: #64748b; font-size: 12px; text-align: center; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚡ BreachAlert</div>
            <div class="badge">Identity Security System</div>
          </div>
          <div class="content">
            <h2 class="title">Verify Email Address Monitoring</h2>
            <p class="text">Thank you for registering with BreachAlert. Please confirm ownership of <strong>${email}</strong> to activate automated breach scanning and real-time security alerts.</p>
            <div class="btn-container">
              <a href="${verifyUrl}" class="btn" target="_blank">Verify Email Address</a>
            </div>
            <p class="text" style="font-size: 13px; color: #64748b;">If the button above doesn't work, copy and paste this link into your web browser:</p>
            <div class="link-box">${verifyUrl}</div>
          </div>
          <div class="footer">
            <p>If you did not request email monitoring for this address, please ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} BreachAlert Personal Cybersecurity Inc. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await this.sendMail({ to: email, subject, html, text });

    if (result.isDevSimulated) {
      console.log(`
┌─────────────────────────────────────────────────────────────┐
│ 🔗 DIRECT EMAIL VERIFICATION LINK (DEV SIMULATION MODE)     │
│ ${verifyUrl.padEnd(59, ' ')} │
└─────────────────────────────────────────────────────────────┘
      `);
      return { ...result, verifyUrl };
    }

    return result;
  }

  /**
   * Send alert notification when a new breach is detected
   */
  async sendBreachAlertEmail(userEmail, monitoredEmail, newBreaches) {
    const subject = `⚠️ URGENT: Security Breach Alert for ${monitoredEmail}`;
    
    const breachListHtml = newBreaches.map((b) => `
      <div style="background-color: #090d16; border-left: 4px solid ${b.severity === 'CRITICAL' ? '#ef4444' : b.severity === 'HIGH' ? '#f97316' : '#eab308'}; padding: 16px; margin-bottom: 16px; border-radius: 8px; border: 1px solid #1e293b; border-left-width: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; color: #f8fafc; font-size: 16px;">${b.title} (${b.breachName})</h3>
          <span style="background: ${b.severity === 'CRITICAL' ? '#7f1d1d' : b.severity === 'HIGH' ? '#7c2d12' : '#713f12'}; color: ${b.severity === 'CRITICAL' ? '#fca5a5' : b.severity === 'HIGH' ? '#ffedd5' : '#fef08a'}; font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">
            ${b.severity}
          </span>
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin: 8px 0;"><strong>Breach Date:</strong> ${b.breachDate ? new Date(b.breachDate).toLocaleDateString() : 'Unknown'}</p>
        <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin: 8px 0;">${b.description}</p>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #111827; border-radius: 16px; border: 1px solid #dc2626; padding: 32px; }
          .title { font-size: 22px; font-weight: 800; color: #ef4444; margin-top: 16px; }
          .text { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          .btn { display: inline-block; background-color: #dc2626; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; margin-top: 20px; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #1e293b; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div style="color: #ef4444; font-size: 22px; font-weight: bold;">⚡ BreachAlert Security Warning</div>
          <h2 class="title">New Data Breach Discovered for ${monitoredEmail}</h2>
          <p class="text">Our threat intelligence scanning detected that your monitored address (<strong>${monitoredEmail}</strong>) appeared in new public security breach dumps.</p>

          ${breachListHtml}

          <a href="${config.clientUrl}/dashboard" class="btn" target="_blank">View Security Dashboard</a>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BreachAlert Personal Cybersecurity Inc.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: userEmail,
      subject,
      html,
      text: `BreachAlert Warning: New breaches found for ${monitoredEmail}. Log in to ${config.clientUrl}/dashboard to review.`,
    });
  }
}

module.exports = new EmailService();
