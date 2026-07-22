# 🚀 Deploying BreachAlert on Render

This guide provides step-by-step instructions to deploy the full-stack **BreachAlert** application to [Render](https://render.com).

---

## ⚡ Option 1: Unified Single Web Service (Recommended - Easiest & Best)

Deploy both frontend and backend together under **one single domain**. This eliminates CORS issues and environment variable setup for API URLs.

### Steps:
1. **Push Changes to GitHub**:
   ```bash
   git add .
   git commit -m "Fix deployment setup for Render"
   git push origin main
   ```

2. **Create Web Service on Render**:
   - Log in to your [Render Dashboard](https://dashboard.render.com).
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository (`breach-monitoring-system`).

3. **Configure Service Settings**:
   - **Name**: `breach-monitoring-system`
   - **Region**: Oregon (or closest to you)
   - **Root Directory**: *(leave blank)*
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

4. **Add Environment Variables**:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Render web service port |
   | `DATABASE_URL` | `file:./server/dev.db` | Embedded SQLite database |
   | `JWT_SECRET` | *(Generate random string)* | Secret key for auth |
   | `HIBP_API_KEY` | `mock` | Or your live HaveIBeenPwned API key |
   | `EMAIL_FROM` | `no-reply@breachalert.io` | Sender address |

5. **Deploy**:
   - Click **Create Web Service**.

---

## 🛠️ Option 2: Separate Frontend & Backend Services (Current Setup)

If you host the React client as a Static Site and Node backend as a separate Web Service:

### Backend Service (`breach-monitoring-systemm`):
- **Root Directory**: `server`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Root URL (`/`)**: Returns a JSON status message confirming the API is online.

### Frontend Static Site (`breach-monitoring-systemm-1`):
- **Root Directory**: `client`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variable**: 
  - `VITE_API_BASE_URL` = `https://breach-monitoring-systemm.onrender.com/api`
- **Routing Rewrite**:
  - The repository now includes `client/public/_redirects` which automatically handles SPA routing rules (`/* /index.html 200`).

> ⚠️ **CRITICAL STEP FOR STATIC SITE**: After adding or editing `VITE_API_BASE_URL` on Render Static Site, you **MUST** go to **Manual Deploy** -> **Clear build cache & deploy** so Vite bakes the backend URL into the client JavaScript bundle during build!

---

## 🔧 Summary of Fixes Applied

1. **Fixed Client SPA `Not Found` (404) on `/login`**:
   - Created `client/public/_redirects` (`/* /index.html 200`). Render automatically routes all client paths like `/login` or `/dashboard` to React Router.

2. **Fixed Backend Root Route `Resource not found - /`**:
   - Updated `server/src/server.js` to return a 200 OK status object with API status details when accessing the root URL directly.

3. **Enhanced API URL Parsing**:
   - Updated `client/src/services/api.js` to automatically trim slashes and append `/api` if needed, preventing URL structure mismatches.


