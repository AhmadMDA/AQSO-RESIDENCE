# AQSO-RESIDENCE Railway Deployment Plan

## Overview

This plan outlines the steps to deploy the AQSO-RESIDENCE full-stack application (React frontend + Node.js backend + MySQL database) to **Railway** - a free hosting platform.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Railway Platform
        subgraph Frontend Service
            FE[React App<br/>Static Build]
        end
        
        subgraph Backend Service
            BE[Node.js/Express<br/>API Server]
        end
        
        subgraph Database Service
            DB[(MySQL<br/>Database)]
        end
    end
    
    User[User Browser] --> FE
    FE --> BE
    BE --> DB
    
    style FE fill:#61dafb
    style BE fill:#68a063
    style DB fill:#00758f
```

## Project Analysis

### Current State
- **Frontend**: React.js SPA with hardcoded `http://localhost:4000` API URLs
- **Backend**: Node.js/Express with Sequelize ORM
- **Database**: MySQL with migrations and seeders
- **Issues**: 
  - API URLs hardcoded in 10+ files
  - Database config uses static `config.json` instead of `DATABASE_URL`

### Files Requiring Modification

| File | Change Required |
|------|-----------------|
| `src/pages/Auth/Signin.js` | Use `REACT_APP_API_URL` env var |
| `src/pages/Auth/Signup.js` | Use `REACT_APP_API_URL` env var |
| `src/pages/Auth/Lock.js` | Use `REACT_APP_API_URL` env var |
| `src/pages/Transactions.js` | Use `REACT_APP_API_URL` env var |
| `src/pages/tables/UserTable.js` | Use `REACT_APP_API_URL` env var |
| `src/pages/tables/DataKavling.js` | Use `REACT_APP_API_URL` env var |
| `src/pages/tables/DataKas.js` | Use `REACT_APP_API_URL` env var |
| `src/pages/RoleManagement.js` | Use `REACT_APP_API_URL` env var |
| `src/pages/MyProfile.js` | Use `REACT_APP_API_URL` env var |
| `src/pages/Settings.js` | Use `REACT_APP_API_URL` env var |
| `src/pages/dashboard/DashboardOverview.js` | Use `REACT_APP_API_URL` env var |
| `backend/models/index.js` | Support `DATABASE_URL` env var |
| `backend/config/config.json` | Add production config with `use_env_variable` |

---

## Implementation Steps

### Phase 1: Code Preparation

#### Step 1.1: Create API Configuration File

Create `src/config/api.js`:
```javascript
// API Base URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export const API_URL = `${API_BASE_URL}/api`;
export const BACKEND_URL = API_BASE_URL;

export default API_URL;
```

#### Step 1.2: Update Frontend Files

Replace all hardcoded `http://localhost:4000` with imports from the config:

**Example change for `src/pages/Auth/Signin.js`:**
```javascript
// Add at top of file
import { API_URL, BACKEND_URL } from '../config/api';

// Replace:
// fetch('http://localhost:4000/api/login', {...})
// With:
fetch(`${API_URL}/login`, {...})

// Replace:
// const backendUrl = 'http://localhost:4000';
// With:
const backendUrl = BACKEND_URL;
```

#### Step 1.3: Update Backend Database Config

Update `backend/config/config.json`:
```json
{
  "development": {
    "username": "root",
    "password": "",
    "database": "aqso_db",
    "host": "localhost",
    "dialect": "mysql",
    "logging": false
  },
  "test": {
    "username": "root",
    "password": "",
    "database": "aqso_db_test",
    "host": "localhost",
    "dialect": "mysql",
    "logging": false
  },
  "production": {
    "use_env_variable": "DATABASE_URL",
    "dialect": "mysql",
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false
      }
    },
    "logging": false
  }
}
```

Update `backend/models/index.js` to handle MySQL URL format:
```javascript
let sequelize;
if (config.use_env_variable) {
  const dbUrl = process.env[config.use_env_variable];
  sequelize = new Sequelize(dbUrl, {
    dialect: 'mysql',
    dialectOptions: config.dialectOptions || {},
    logging: config.logging
  });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}
```

#### Step 1.4: Create Environment Files

Create `.env.example` in root:
```
REACT_APP_API_URL=http://localhost:4000
```

Create `backend/.env.production.example`:
```
NODE_ENV=production
PORT=4000
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secure-jwt-secret-here
FRONTEND_URL=https://your-frontend-url.railway.app
```

---

### Phase 2: Railway Setup

#### Step 2.1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub account
3. Verify your account

#### Step 2.2: Create New Project
1. Click **New Project**
2. Select **Empty Project**
3. Name it `aqso-residence`

#### Step 2.3: Add MySQL Database
1. Click **+ New** in the project
2. Select **Database** > **Add MySQL**
3. Wait for provisioning
4. Note the connection details from Variables tab:
   - `MYSQL_URL` or `DATABASE_URL`
   - Individual vars: `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`

#### Step 2.4: Deploy Backend Service
1. Click **+ New** > **GitHub Repo**
2. Select the `AhmadMDA/AQSO-RESIDENCE` repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=${{MySQL.DATABASE_URL}}
   JWT_SECRET=<generate-secure-key>
   FRONTEND_URL=<will-update-after-frontend-deploy>
   ```
5. Click **Deploy**

#### Step 2.5: Run Database Migrations
1. After backend deploys, go to **Settings** > **Railway Shell**
2. Run:
   ```bash
   cd backend
   npm run migrate
   npm run seed  # Optional: seed initial data
   ```

#### Step 2.6: Deploy Frontend Service
1. Click **+ New** > **GitHub Repo**
2. Select the same repository
3. Configure:
   - **Root Directory**: `/` (root)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s build -l $PORT`
4. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://<backend-service-name>.railway.app
   ```
5. Click **Deploy**

#### Step 2.7: Update Backend CORS
After frontend is deployed, update backend `FRONTEND_URL` env var with the frontend URL.

---

### Phase 3: Post-Deployment Configuration

#### Step 3.1: Generate Custom Domains (Optional)
1. Go to each service **Settings**
2. Click **Generate Domain** or add custom domain

#### Step 3.2: Test the Application
1. Visit frontend URL
2. Test login/register functionality
3. Test CRUD operations
4. Check browser console for errors

#### Step 3.3: Monitor and Debug
- Use Railway **Logs** tab for real-time logs
- Use **Metrics** for resource usage
- Set up **Healthchecks** if needed

---

## Environment Variables Summary

### Backend Service
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `4000` |
| `DATABASE_URL` | MySQL connection URL | `mysql://user:pass@host:port/db` |
| `JWT_SECRET` | JWT signing secret | `<secure-random-string>` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://frontend.railway.app` |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP port | `587` |
| `SMTP_USER` | Email username | `your-email@gmail.com` |
| `SMTP_PASS` | Email app password | `<app-password>` |

### Frontend Service
| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://backend.railway.app` |

---

## Railway Free Tier Limits

As of 2024, Railway offers:
- **$5 free credit per month** (no credit card required)
- **500 hours of usage** per month
- **1GB RAM** per service
- **1GB disk** for database

> **Note**: If usage exceeds free tier, you can add a credit card for pay-as-you-go billing.

---

## Alternative: Monorepo Deployment

If you prefer a single deployment configuration, create `railway.json` in root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

And `Procfile`:
```
web: cd backend && npm start
```

But the **recommended approach** is separate services for better control and scaling.

---

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` format
   - Ensure MySQL service is running
   - Check SSL settings in production config

2. **CORS Errors**
   - Verify `FRONTEND_URL` in backend env
   - Check that backend CORS includes the frontend domain

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in `package.json`
   - Check for missing environment variables

4. **API Calls Failing**
   - Verify `REACT_APP_API_URL` is set correctly
   - Check backend logs for errors
   - Ensure migrations ran successfully

---

## Next Steps After Deployment

1. Set up monitoring and alerts
2. Configure automatic deployments from GitHub
3. Set up staging environment
4. Implement CI/CD pipeline
5. Configure custom domain and SSL
6. Set up backup strategy for MySQL data

---

## Quick Reference Commands

```bash
# Local development
npm start                    # Start frontend
cd backend && npm start     # Start backend

# Database operations
cd backend && npm run migrate       # Run migrations
cd backend && npm run seed          # Seed data
cd backend && npm run migrate:undo  # Rollback last migration

# Build for production
npm run build               # Build frontend
```

---

## Summary

The deployment requires:
1. **8 frontend files** to be updated with environment variable for API URL
2. **2 backend files** to support `DATABASE_URL`
3. **3 Railway services**: MySQL, Backend, Frontend
4. **~10 environment variables** to configure

Estimated setup time: 30-60 minutes for initial deployment.
