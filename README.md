# ⚡ BreachAlert – Personal Data Breach Monitoring Service

> A production-ready, full-stack personal cybersecurity platform that monitors email addresses against data breach databases (Have I Been Pwned API), caches results in Redis, schedules automated background scans, delivers instant email alert notifications, and enforces tiered subscription plans.

---

## 🚀 Key Features

* **🔐 User Authentication**: Register, Login, JWT authentication with 7-day expiration, bcrypt password hashing (12 salt rounds), and protected routes.
* **📧 Real SMTP Email Delivery & Verification**: Real verification link delivery using Nodemailer SMTP or SendGrid. Automatic fallback to simulation mode when SMTP credentials are missing.
* **🛡️ Have I Been Pwned (HIBP) Integration**: Clean reusable service layer communicating with HIBP API v3 with rate limit detection (`Retry-After` headers), risk severity heuristic grading (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), and automatic fallback mock mode when an API key is omitted.
* **📊 Security Control Dashboard**: Modern cybersecurity dashboard displaying monitored addresses, breach history cards, leaked data class badges, domain information, and actionable security mitigation steps.
* **⏰ Nightly Background Scheduler**: Automated nightly breach scanning executed via `node-cron` for active subscribers.
* **⚡ Redis Caching (24h TTL)**: Caches HIBP responses for 24 hours to eliminate redundant external requests and respect rate limits. Built-in automatic in-memory fallback if Redis is disconnected.
* **📩 Email Alert System**: Responsive HTML email notifications for email verification and urgent breach warnings with retry logic and error logging.
* **💎 Subscription Plan Tiers**:
  * **Free Plan**: 1 Monitored Email Address, Manual Scans only.
  * **Family Plan**: Up to 5 Monitored Email Addresses, Automated Nightly Scans, Instant Email Breach Alerts.
* **🔒 Security Hardening**: Helmet HTTP headers, CORS origin restrictions, Express rate limiters for auth and API routes, input sanitization via `express-validator`, SQL injection protection via Prisma ORM parameterized queries.

---

## 📂 Project Architecture & Folder Structure

```text
breachalert/
├── docker-compose.yml              # PostgreSQL + Redis container orchestrator
├── README.md                       # Comprehensive system documentation
├── .env.example                    # Global environment variables template
│
├── server/                         # Express.js + Prisma + Redis Backend
│   ├── .env.example                # Backend environment configuration template
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma           # Prisma database models (User, MonitoredEmail, BreachRecord)
│   └── src/
│       ├── config/
│       │   ├── env.js              # Environment loader & validator
│       │   ├── db.js               # Prisma client connection instance
│       │   └── redis.js            # ioredis client with in-memory fallback
│       ├── controllers/
│       │   ├── authController.js   # Authentication controller (Register, Login, Me)
│       │   ├── emailController.js  # Email CRUD & Verification logic
│       │   ├── breachController.js # HIBP manual scan & breach history
│       │   └── subscriptionController.js # Plan tier switcher
│       ├── middleware/
│       │   ├── authMiddleware.js   # JWT authentication verification
│       │   ├── planMiddleware.js   # Tier limit enforcement (1 vs 5 emails)
│       │   ├── rateLimiter.js      # Express rate limiters (auth, API, scan)
│       │   └── errorHandler.js    # Global error handler
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── emailRoutes.js
│       │   ├── breachRoutes.js
│       │   └── subscriptionRoutes.js
│       ├── services/
│       │   ├── hibpService.js      # HIBP API integration & caching
│       │   ├── emailService.js     # Nodemailer SMTP / SendGrid HTML mailer with retry logic
│       │   └── schedulerService.js # node-cron nightly scanner
│       ├── utils/
│       │   └── seed.js             # Database seeder script
│       └── server.js               # Express application entry point
│
└── client/                         # React.js + Vite + Tailwind CSS Frontend
    ├── package.json
    ├── vite.config.js              # Vite server & API proxy config
    ├── tailwind.config.js          # Cyber dark theme tokens
    ├── index.html                  # HTML5 entry with Google Fonts
    └── src/
        ├── index.css               # Global glassmorphism design system
        ├── main.jsx
        ├── App.jsx                 # Router & protected layout
        ├── services/
        │   └── api.js              # Axios instance with JWT interceptors
        ├── context/
        │   └── AuthContext.jsx     # Authentication state provider
        ├── components/
        │   ├── Navbar.jsx          # Header with user plan badge
        │   ├── Footer.jsx          # Status indicators
        │   ├── StatCards.jsx       # Overview metrics
        │   ├── MonitoredEmailList.jsx # Email management & manual scan trigger
        │   ├── AddEmailModal.jsx   # Add email target dialog
        │   ├── BreachCard.jsx      # Breach event card UI
        │   ├── BreachDetailModal.jsx # Full breach analysis & checklist
        │   ├── PlanSelectorModal.jsx # Plan tier selection modal
        │   └── EmailVerificationNotice.jsx # Verification alert banner
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── DashboardPage.jsx
            └── VerifyEmailPage.jsx
```

---

## 🛠️ Local Development Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Docker Desktop** (Optional, for running local PostgreSQL & Redis)

---

### 2. Start Services
If you have Docker installed, spin up PostgreSQL and Redis from the root:

```bash
docker compose up -d
```

*(Note: SQLite is configured by default for zero-dependency execution).*

---

### 3. Backend Setup (`server/`)

```bash
cd server
npm install
```

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

#### Run Database Migrations:

```bash
npx prisma db push
```

#### Start Backend Server:

```bash
npm run dev
```

---

### 4. Frontend Setup (`client/`)

```bash
cd client
npm install
npm run dev
```

The React frontend will start on `http://localhost:5173`.

---

## 📧 Email Delivery Configuration (SMTP & SendGrid)

BreachAlert supports **real SMTP delivery via Nodemailer**, API delivery via **SendGrid**, and an automatic **simulation fallback** for local offline testing.

### Option A: Gmail SMTP Configuration (App Password)

To send real verification emails and breach alerts to actual inboxes via Gmail:

1. Enable **2-Step Verification** on your Google Account (`myaccount.google.com/security`).
2. Generate a 16-character **App Password**:
   - Go to Google Account > Security > 2-Step Verification > App passwords.
   - Select App: *Other (Custom name)* -> Name it `BreachAlert`.
   - Copy the generated 16-character passcode (e.g. `abcd efgh ijkl mnop`).
3. Update your `.env` file with your credentials:

```env
EMAIL_FROM=no-reply@breachalert.io
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
```

---

### Option B: SendGrid Configuration

To use SendGrid API:

1. Sign up for a [SendGrid](https://sendgrid.com) account and create an API Key with Mail Send permissions.
2. Update `.env`:

```env
EMAIL_FROM=verified_sender@yourdomain.com
SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key
```

---

### Option C: Simulation Mode (Fallback)

If `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `SENDGRID_API_KEY` are not set or commented out:
- BreachAlert automatically activates **Simulation Mode**.
- Verification links are logged directly to the server terminal console.
- In-app dev verification links will be enabled for seamless local testing without external mail dependencies.

---

## 🔑 Environment Variables Reference

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Express server port | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `CLIENT_URL` | Frontend client URL for verification links | `http://localhost:5173` |
| `DATABASE_URL` | Prisma database URL | `file:./dev.db` |
| `REDIS_URL` | Redis cache connection URI | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `super_secret_key` |
| `EMAIL_FROM` | Envelope sender address (Required) | `no-reply@breachalert.io` |
| `SMTP_HOST` | Real SMTP host server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port (`587` for TLS / `465` for SSL) | `587` |
| `SMTP_USER` | SMTP username / email address | `user@gmail.com` |
| `SMTP_PASS` | SMTP password / App Password | `app_password_here` |
| `SENDGRID_API_KEY` | SendGrid API Key (Optional) | `SG.xxx...` |

---

## 📡 REST API Documentation

### Authentication Endpoints

#### 1. Register User
* **Endpoint**: `POST /api/auth/register`
* **Body**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
* **Behavior**: Creates account, adds primary email to monitoring list, and dispatches real verification email to `user.email`.

#### 2. Verify Email Address
* **Endpoint**: `GET /api/emails/verify?token=<TOKEN>`
* **Behavior**: Verifies email token in database and activates automated monitoring.

---

## 🛡️ Security Features Overview

1. **Password Hashing**: `bcryptjs` with 12 salt rounds.
2. **JWT Authentication**: Encrypted bearer tokens.
3. **HTTP Header Hardening**: Express `helmet` protection.
4. **Rate Limiting**: IP-based rate limiting on login/registration and breach scans.
5. **SQL Injection Defense**: Prisma ORM parameterized queries.

---

## 📜 License

This project is open-source under the MIT License.
