# 🚀 Deploying BreachAlert on Render

This guide provides step-by-step instructions to deploy the full-stack **BreachAlert** application to [Render](https://render.com).

Render allows hosting both the **Express backend Web Service** and the **React Vite Static Site** for free.

---

## 🛠️ Option 1: Deployment via Render Blueprint (Recommended - 1-Click)

The repository includes a `render.yaml` Blueprint file that automatically configures both services on Render.

### Steps:
1. **Push Changes to GitHub**:
   Ensure your code and the `render.yaml` file are pushed to your GitHub repository:
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Connect GitHub to Render**:
   - Log in to your [Render Dashboard](https://dashboard.render.com).
   - Click **New +** in the top right and select **Blueprint**.
   - Connect your GitHub repository (`breach-monitoring-system`).

3. **Configure Environment Variables**:
   Render will parse `render.yaml` and create two services:
   - **`breachalert-server`** (Node.js Web Service)
   - **`breachalert-client`** (Static Site)

   Provide the values when prompted:
   - `CLIENT_URL`: Enter your expected frontend URL (e.g. `https://breachalert-client.onrender.com`).
   - `VITE_API_BASE_URL`: Enter your expected backend API URL (e.g. `https://breachalert-server.onrender.com/api`).
   - `JWT_SECRET`: Leave as auto-generated or enter a random secure string (32+ chars).

4. **Deploy**:
   - Click **Apply**. Render will automatically build and spin up both services.

---

## ⚙️ Option 2: Manual Deployment on Render

If you prefer to configure each service manually via the Render UI:

### 1. Deploy Backend Web Service (`breachalert-server`)

1. Click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name**: `breachalert-server`
   - **Region**: Oregon (or closest to you)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Add Environment Variables:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Port assigned by Render |
   | `DATABASE_URL` | `file:./dev.db` | Embedded SQLite database file |
   | `JWT_SECRET` | `your_secret_key_here` | 32+ character secret key |
   | `CLIENT_URL` | `https://breachalert-client.onrender.com` | Deployed frontend URL |
   | `HIBP_API_KEY` | `mock` | Or your actual HIBP API key |
   | `EMAIL_FROM` | `no-reply@breachalert.io` | Sender email address |
5. Click **Create Web Service**.
6. Copy your backend URL (e.g. `https://breachalert-server.onrender.com`).

---

### 2. Deploy Frontend Static Site (`breachalert-client`)

1. Click **New +** -> **Static Site**.
2. Connect your GitHub repository.
3. Configure the static site:
   - **Name**: `breachalert-client`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variable:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://breachalert-server.onrender.com/api` |
5. Add Redirects/Rewrites Rule (for React Router single page app):
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
6. Click **Create Static Site**.

---

## 🔍 Verification & Health Check

1. **Verify Backend Health**:
   Visit `https://breachalert-server.onrender.com/api/health` in your browser. Expected response:
   ```json
   {
     "status": "online",
     "timestamp": "2026-07-22T...",
     "redis": "in-memory-fallback",
     "environment": "production",
     "hibpMode": "mock"
   }
   ```

2. **Verify Frontend Application**:
   Visit `https://breachalert-client.onrender.com`. Test user registration, login, email monitoring, manual scans, and plan switching.

---

## 📌 Important Notes for Render Free Tier

- **Cold Starts**: On Render's free tier, Web Services automatically spin down after 15 minutes of inactivity. The first request after spin-down may take 30-50 seconds while the instance boots up.
- **SQLite Persistence**: By default, SQLite stores data in `server/dev.db`. On free tier web services without persistent disks, the filesystem resets on service restarts/redeploys. For permanent data storage across redeployments, attach a Render PostgreSQL database service and set `DATABASE_URL` accordingly in Prisma schema.
