# Netlify Deployment Guide - CDN XData Frontend

Complete guide for deploying the **CDN XData** frontend to Netlify with automatic GitHub Actions deployment.

**Developed by [Cognition Labs EU](https://cognitiolabs.eu)**

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Setup Netlify Site](#setup-netlify-site)
- [Configure GitHub Secrets](#configure-github-secrets)
- [Frontend Environment Configuration](#frontend-environment-configuration)
- [Deploy via GitHub Actions](#deploy-via-github-actions)
- [Manual Deploy (CLI)](#manual-deploy-cli)
- [Custom Domain Setup](#custom-domain-setup)
- [Troubleshooting](#troubleshooting)
- [Production Checklist](#production-checklist)

---

## Overview

This guide deploys the **frontend only** to Netlify. The backend must run elsewhere (Coolify, VPS, Docker) because:

❌ **Backend cannot run on Netlify:**
- Netlify Functions are serverless (no persistent storage)
- Image storage requires filesystem persistence
- Thumbnail generation exceeds serverless timeout limits (26s max)
- Session management requires persistent memory or Redis

✅ **What this deployment does:**
- Deploy React frontend to Netlify CDN
- Automatic deployment on every push to `main`
- Deploy previews for pull requests
- Global CDN distribution for fast loading
- Automatic HTTPS with Let's Encrypt

**Architecture:**
```
Frontend (Netlify CDN)  →  API calls  →  Backend (cdn.xdata.si:3000)
    ↓                                          ↓
React SPA + Static Assets            Bun Server + File Storage
```

---

## Architecture

### Deployment Flow

```
┌─────────────────┐
│  GitHub Push    │
│   (main branch) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ GitHub Actions  │
│  Workflow Run   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌─────────────────┐
│ Build Frontend  │      │  Backend Server │
│  (npm build)    │      │  (cdn.xdata.si) │
└────────┬────────┘      └────────┬────────┘
         │                        │
         ↓                        │
┌─────────────────┐              │
│ Deploy to       │              │
│ Netlify CDN     │              │
└────────┬────────┘              │
         │                        │
         ↓                        │
┌─────────────────┐              │
│ User Browser    │──API calls──→│
└─────────────────┘              │
```

### URL Structure

- **Frontend**: `https://your-site.netlify.app` (or custom domain)
- **Backend API**: `https://cdn.xdata.si/api/*`
- **Backend CDN**: `https://cdn.xdata.si/cdn/*`

---

## Prerequisites

### 1. Netlify Account
- Create account at [netlify.com](https://www.netlify.com/)
- Free tier includes:
  - 100GB bandwidth/month
  - Automatic HTTPS
  - Global CDN
  - Deploy previews

### 2. Backend Deployed
- Backend must be running on accessible URL (e.g., `https://cdn.xdata.si`)
- Backend must have CORS configured to allow frontend domain
- See [DEPLOYMENT.md](DEPLOYMENT.md) or [COOLIFY.md](COOLIFY.md) for backend setup

### 3. GitHub Repository
- Code pushed to GitHub: https://github.com/XData-si/simple-cdn

---

## Setup Netlify Site

### Option A: Via Netlify Dashboard (Recommended)

1. **Login to Netlify**
   - Go to https://app.netlify.com
   - Login with GitHub account

2. **Create New Site**
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Authorize Netlify to access your repositories

3. **Select Repository**
   - Search for: `XData-si/simple-cdn`
   - Click repository to connect

4. **Configure Build Settings**
   ```
   Build command: cd frontend && npm install && npm run build
   Publish directory: frontend/dist
   ```

5. **Deploy Site**
   - Click "Deploy site"
   - Netlify will assign URL: `https://random-name-12345.netlify.app`
   - **Copy the Site ID** from Site Settings → Site details

6. **Get Authentication Token**
   - Go to User Settings → Applications → Personal access tokens
   - Click "New access token"
   - Name: `GitHub Actions Deploy`
   - **Copy the token** (shows only once!)

### Option B: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Create new site
netlify init

# Follow prompts to connect repository
```

---

## Configure GitHub Secrets

Add Netlify credentials to GitHub repository secrets:

### 1. Go to Repository Settings

```
https://github.com/XData-si/simple-cdn/settings/secrets/actions
```

### 2. Add Secrets

Click **"New repository secret"** and add:

#### `NETLIFY_AUTH_TOKEN`
- **Value**: Personal access token from Netlify
- **Get from**: Netlify Dashboard → User Settings → Applications → Personal access tokens

#### `NETLIFY_SITE_ID`
- **Value**: Site ID from Netlify
- **Get from**: Netlify Dashboard → Site Settings → Site details → Site ID
- Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### 3. Verify Secrets

Secrets should appear as:
```
NETLIFY_AUTH_TOKEN     ••••••••••••••••
NETLIFY_SITE_ID        ••••••••••••••••
```

---

## Frontend Environment Configuration

### Update API Base URL

The frontend needs to know where the backend is running.

**Option A: Environment Variable (Build Time)**

Edit `frontend/.env.production`:
```env
VITE_API_BASE_URL=https://cdn.xdata.si
```

**Option B: Runtime Configuration**

Alternatively, detect API URL at runtime in `frontend/src/api/client.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
                     window.location.hostname === 'localhost'
                       ? 'http://localhost:3000'
                       : 'https://cdn.xdata.si';
```

### Backend CORS Configuration

Backend must allow requests from Netlify domain.

Edit backend `src/server.ts` or add environment variable:

```typescript
// Allow Netlify domain
headers.set('Access-Control-Allow-Origin', 'https://your-site.netlify.app');
headers.set('Access-Control-Allow-Credentials', 'true');
```

Or use environment variable:
```env
CORS_ORIGIN=https://your-site.netlify.app
```

---

## Deploy via GitHub Actions

### Automatic Deployment

GitHub Actions workflow (`.github/workflows/netlify-deploy.yml`) automatically deploys on:

✅ **Push to `main` branch** (production deploy)
```bash
git push origin main
```

✅ **Pull requests** (deploy preview)
```bash
# Create PR → automatic preview deploy
# Comment on PR with preview URL
```

✅ **Manual trigger**
```bash
# Go to Actions tab → "Deploy to Netlify" → "Run workflow"
```

### Monitor Deployment

1. **GitHub Actions Tab**
   - https://github.com/XData-si/simple-cdn/actions
   - Click workflow run to see logs

2. **Netlify Deploys Tab**
   - https://app.netlify.com/sites/YOUR-SITE/deploys
   - See build logs, deploy status

### Deployment Triggers

Workflow runs only when these files change:
- `frontend/**` - Any frontend file
- `netlify.toml` - Netlify configuration
- `.github/workflows/netlify-deploy.yml` - Workflow itself

**Optimization**: Backend changes won't trigger Netlify deploy.

---

## Manual Deploy (CLI)

For testing or one-off deploys:

### 1. Build Frontend Locally

```bash
cd frontend
npm install
npm run build
```

### 2. Deploy with Netlify CLI

```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy (draft)
netlify deploy --dir=dist

# Deploy (production)
netlify deploy --prod --dir=dist
```

### 3. Deploy from Repository Root

```bash
# From repository root
netlify deploy --prod --dir=frontend/dist
```

---

## Custom Domain Setup

### Option A: Netlify Subdomain (Free)

Netlify provides: `https://your-site.netlify.app`

**Customize subdomain:**
1. Site Settings → Domain management → Options → Edit site name
2. Choose available name: `cdn-xdata.netlify.app`

### Option B: Custom Domain (Recommended)

**Example**: Deploy frontend to `app.xdata.si`, backend stays at `cdn.xdata.si`

#### 1. Add Domain in Netlify

- Site Settings → Domain management → Add custom domain
- Enter: `app.xdata.si`
- Netlify provides DNS configuration

#### 2. Update DNS Records

Add to your DNS provider:

```
Type    Name    Value
CNAME   app     your-site.netlify.app
```

Or use Netlify DNS (recommended):
- Transfer nameservers to Netlify
- Automatic SSL certificate management

#### 3. Wait for DNS Propagation (5-60 minutes)

```bash
# Check DNS
dig app.xdata.si +short
```

#### 4. SSL Certificate

Netlify automatically provisions SSL via Let's Encrypt (free).

**Verify HTTPS:**
```bash
curl -I https://app.xdata.si
```

#### 5. Update Backend CORS

```env
# Backend .env
CORS_ORIGIN=https://app.xdata.si
```

---

## Troubleshooting

### Build Fails in GitHub Actions

**Error**: `npm install` fails

**Solution**: Check `frontend/package.json` dependencies
```bash
# Test locally
cd frontend
npm install
npm run build
```

**Error**: `frontend/dist` not found

**Solution**: Verify build command in `netlify.toml`:
```toml
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/dist"
```

### Secrets Not Working

**Error**: `Error: Missing required secret NETLIFY_AUTH_TOKEN`

**Solution**:
1. Verify secrets in GitHub: Settings → Secrets and variables → Actions
2. Secrets are case-sensitive: `NETLIFY_AUTH_TOKEN` not `netlify_auth_token`
3. Re-create secret if needed

### Deploy Succeeds But Site Shows 404

**Cause**: Incorrect publish directory

**Solution**: Check `netlify.toml`:
```toml
publish = "frontend/dist"  # Not "dist"
```

### API Calls Fail (CORS Error)

**Error in browser console:**
```
Access to fetch at 'https://cdn.xdata.si/api/list' from origin 'https://your-site.netlify.app'
has been blocked by CORS policy
```

**Solution**: Update backend CORS configuration:

```typescript
// backend/src/server.ts
headers.set('Access-Control-Allow-Origin', 'https://your-site.netlify.app');
headers.set('Access-Control-Allow-Credentials', 'true');
headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
headers.set('Access-Control-Allow-Headers', 'Content-Type, Cookie');
```

### SPA Routing Not Working

**Error**: Refreshing page shows Netlify 404

**Solution**: Verify redirect rule in `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Deployment Takes Too Long

**Optimization**:

1. **Use npm cache in GitHub Actions**:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: frontend/package-lock.json
```

2. **Install only production dependencies**:
```bash
npm ci --production
```

---

## Production Checklist

### Before First Deploy

- [ ] Backend deployed and accessible
- [ ] Backend health check works: `curl https://cdn.xdata.si/healthz`
- [ ] Backend CORS configured for Netlify domain
- [ ] GitHub secrets configured (`NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`)
- [ ] Frontend API URL points to backend
- [ ] Netlify site created and connected

### After Deploy

- [ ] Frontend loads: `https://your-site.netlify.app`
- [ ] Login works (test with admin credentials)
- [ ] File upload works
- [ ] File list/browse works
- [ ] CDN URLs load images: `https://cdn.xdata.si/cdn/test.jpg`
- [ ] No CORS errors in browser console
- [ ] SSL certificate valid (green padlock)
- [ ] Custom domain configured (if applicable)

### Monitoring

- [ ] Setup Netlify deploy notifications (Slack, email)
- [ ] Monitor Netlify analytics: https://app.netlify.com/sites/YOUR-SITE/analytics
- [ ] Monitor backend health: `https://cdn.xdata.si/healthz`
- [ ] Check GitHub Actions for failed deployments

---

## Configuration Files Reference

### `netlify.toml`

```toml
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### `.github/workflows/netlify-deploy.yml`

Key sections:
```yaml
on:
  push:
    branches: [main]
    paths: ['frontend/**']
  pull_request:
    branches: [main]

jobs:
  deploy:
    steps:
      - uses: nwtgck/actions-netlify@v3.0
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## Architecture Comparison

### Option 1: Netlify Frontend + Remote Backend (This Guide)

```
┌─────────────────────────┐
│   Netlify CDN (Global)  │  ← Frontend (React SPA)
│  https://app.xdata.si   │
└───────────┬─────────────┘
            │ API calls
            ↓
┌─────────────────────────┐
│  Backend (VPS/Coolify)  │  ← Backend (Bun + Storage)
│  https://cdn.xdata.si   │
└─────────────────────────┘
```

**Pros:**
- ✅ Global CDN for fast frontend loading
- ✅ Automatic SSL and deployments
- ✅ Free tier (100GB bandwidth)
- ✅ Deploy previews for PRs

**Cons:**
- ❌ Two separate deployments
- ❌ CORS configuration needed
- ❌ Slightly more complex setup

### Option 2: Full Stack on Coolify (See COOLIFY.md)

```
┌─────────────────────────┐
│   Coolify (Single VPS)  │
│  ┌──────────────────┐   │
│  │ Frontend + Backend│   │  ← Everything on one server
│  │   cdn.xdata.si    │   │
│  └──────────────────┘   │
└─────────────────────────┘
```

**Pros:**
- ✅ Single deployment
- ✅ No CORS issues
- ✅ Easier management

**Cons:**
- ❌ No global CDN for frontend
- ❌ Manual SSL management (unless Coolify handles)

---

## Support

**Cognition Labs EU**
- Website: https://cognitiolabs.eu
- CDN: https://cdn.xdata.si
- Email: admin@cognitiolabs.eu

**Documentation:**
- [README.md](README.md) - Project overview
- [DEPLOYMENT.md](DEPLOYMENT.md) - Manual Docker deployment
- [COOLIFY.md](COOLIFY.md) - Coolify PaaS deployment
- [PROXY.md](PROXY.md) - External proxy configuration

**Netlify Resources:**
- [Netlify Docs](https://docs.netlify.com/)
- [GitHub Actions for Netlify](https://github.com/nwtgck/actions-netlify)
- [Netlify Support](https://answers.netlify.com/)

---

**CDN XData** - Professional image CDN service by Cognition Labs EU
