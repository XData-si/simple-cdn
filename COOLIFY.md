# Coolify Deployment Guide - CDN XData

**Complete step-by-step guide for deploying CDN XData to production using Coolify.**

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Architecture on Coolify](#architecture-on-coolify)
- [Step 1: Prepare Coolify](#step-1-prepare-coolify)
- [Step 2: Create New Resource](#step-2-create-new-resource)
- [Step 3: Configure Backend Service](#step-3-configure-backend-service)
- [Step 4: Environment Variables](#step-4-environment-variables)
- [Step 5: Storage & Volumes](#step-5-storage--volumes)
- [Step 6: Deploy Backend](#step-6-deploy-backend)
- [Step 7: Frontend Deployment](#step-7-frontend-deployment)
- [Step 8: Configure Domain & SSL](#step-8-configure-domain--ssl)
- [Step 9: Verify Deployment](#step-9-verify-deployment)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Monitoring & Logs](#monitoring--logs)
- [Updates & Rollbacks](#updates--rollbacks)
- [Backup Strategy](#backup-strategy)
- [Troubleshooting](#troubleshooting)

---

## Introduction

**Coolify** is a self-hosted PaaS (Platform as a Service) that simplifies deploying applications with:
- ✅ Git integration
- ✅ Automatic Docker builds
- ✅ Environment variable management
- ✅ SSL certificates (Let's Encrypt)
- ✅ Custom domains
- ✅ Built-in reverse proxy
- ✅ One-click deployments

**What we'll deploy:**
- Backend API (Bun + TypeScript) - Docker container
- Frontend (React + Vite) - Static files via Coolify's proxy
- Storage volumes for uploads
- SSL certificate for cdn.xdata.si

---

## Prerequisites

### Required

1. **Coolify Instance** running on your server
   - Coolify v4.0+ installed and accessible
   - Access to Coolify dashboard (e.g., `https://coolify.yourdomain.com`)

2. **Domain**
   - `cdn.xdata.si` pointing to your Coolify server IP
   - DNS A record configured

3. **GitHub Repository**
   - Access to: https://github.com/XData-si/simple-cdn
   - Coolify needs read access (SSH key or GitHub App)

4. **Server Requirements**
   - 2GB+ RAM
   - 20GB+ disk space
   - Ubuntu 22.04+ (recommended)
   - Docker installed (via Coolify setup)

### Optional but Recommended

- GitHub Personal Access Token (for private repos)
- SSH key for deployment notifications
- Monitoring tools (Coolify has built-in monitoring)

---

## Architecture on Coolify

```
Internet
    ↓
Coolify Reverse Proxy (Traefik)
    ↓
┌─────────────────────┬──────────────────────┐
│                     │                      │
Frontend (Static)     Backend (Docker)      Storage (Volume)
Port: 80/443          Port: 3000            /app/storage
```

**Components:**
1. **Backend Service** - Docker container (simple-cdn-backend)
2. **Frontend Files** - Static files served by Coolify proxy
3. **Storage Volume** - Persistent volume for uploads
4. **Reverse Proxy** - Traefik (managed by Coolify)

---

## Step 1: Prepare Coolify

### 1.1 Login to Coolify Dashboard

```
URL: https://coolify.yourdomain.com
Login with your credentials
```

### 1.2 Navigate to Projects

1. Click **Projects** in sidebar
2. Select existing project or create new one:
   - Click **+ New Project**
   - Name: `CDN XData`
   - Description: `Image CDN by Cognition Labs EU`
   - Click **Create**

### 1.3 Create New Environment

Inside your project:
1. Click **+ New Environment**
2. Name: `production`
3. Click **Create**

---

## Step 2: Create New Resource

### 2.1 Add New Resource

In your environment:
1. Click **+ New**
2. Select **Public Repository** or **Private Repository**

### 2.2 Configure Git Repository

**For Public Repository:**
```
Repository URL: https://github.com/XData-si/simple-cdn
Branch: main
```

**For Private Repository:**
1. Generate SSH key in Coolify (Settings → SSH Keys)
2. Add public key to GitHub (Settings → Deploy Keys)
3. Use SSH URL: `git@github.com:XData-si/simple-cdn.git`

### 2.3 Select Build Pack

1. Coolify will detect `Dockerfile.backend`
2. Select **Dockerfile** as build pack
3. Dockerfile path: `docker/Dockerfile.backend`
4. Build context: `.` (root)

Click **Continue**

---

## Step 3: Configure Backend Service

### 3.1 General Settings

**Service Name:** `cdn-xdata-backend`

**Description:** `CDN XData Backend API - Bun + TypeScript`

**Dockerfile Settings:**
```
Dockerfile Location: docker/Dockerfile.backend
Docker Context: .
Target: (leave empty - single stage build)
```

### 3.2 Port Configuration

**Exposed Port:** `3000`

**Port Mapping:**
- Container Port: `3000`
- Host Port: `3000` (internal)

**Note**: Coolify's reverse proxy will handle external traffic on port 80/443.

### 3.3 Health Check

**Health Check URL:** `/healthz`

**Health Check Method:** `GET`

**Health Check Port:** `3000`

**Expected Status Code:** `200`

**Health Check Interval:** `30s`

**Health Check Timeout:** `3s`

**Health Check Retries:** `3`

**Health Check Start Period:** `10s`

---

## Step 4: Environment Variables

### 4.1 Navigate to Environment Variables

In service settings:
1. Click **Environment Variables** tab
2. Click **+ Add Variable**

### 4.2 Required Variables

Add each variable below:

#### Admin Credentials

```bash
# Variable: ADMIN_USERNAME
Value: admin

# Variable: ADMIN_PASSWORD_HASH
Value: [Generate hash - see below]
```

**Generate Password Hash:**
```bash
# On your local machine (requires Bun):
cd backend
bun install
echo -n "your-secure-password" | bun run scripts/hash-password.ts

# Copy the output hash
```

#### Storage Configuration

```bash
# Variable: STORAGE_TYPE
Value: local

# Variable: STORAGE_ROOT
Value: /app/storage
```

#### Application Configuration

```bash
# Variable: BASE_URL
Value: https://cdn.xdata.si

# Variable: PORT
Value: 3000

# Variable: NODE_ENV
Value: production
```

#### Security

```bash
# Variable: SESSION_SECRET
Value: [Generate random 64-character string]

# To generate:
# openssl rand -hex 32
# or
# cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1
```

```bash
# Variable: MAX_UPLOAD_SIZE
Value: 10485760

# Variable: RATE_LIMIT_REQUESTS
Value: 100

# Variable: RATE_LIMIT_WINDOW
Value: 60000
```

#### Features

```bash
# Variable: READONLY
Value: false

# Variable: ENABLE_METRICS
Value: true
```

#### Thumbnails

```bash
# Variable: THUMBNAIL_SIZE
Value: 128

# Variable: THUMBNAIL_QUALITY
Value: 85
```

#### Logging

```bash
# Variable: LOG_LEVEL
Value: info
```

### 4.3 Save Environment Variables

Click **Save** after adding all variables.

**Security Tip:** Mark sensitive variables (PASSWORD_HASH, SESSION_SECRET) as "Secret" in Coolify to hide values.

---

## Step 5: Storage & Volumes

### 5.1 Create Persistent Volume

Backend needs persistent storage for uploaded files.

**In Coolify:**
1. Go to service settings
2. Click **Storages** tab
3. Click **+ Add Volume**

**Volume Configuration:**
```
Name: cdn-storage
Source: cdn-xdata-storage
Destination: /app/storage
```

**Options:**
- ✅ Persistent Volume (enabled)
- Volume Driver: `local`

**Click Save**

### 5.2 Verify Volume

Volume will be created on host at:
```
/var/lib/docker/volumes/cdn-xdata-storage/_data
```

Coolify automatically manages this location.

---

## Step 6: Deploy Backend

### 6.1 Start Deployment

1. Review all settings
2. Click **Deploy** button (top right)
3. Select deployment type:
   - **Force Rebuild**: First deployment or code changes
   - **Restart Only**: Config/env changes only

**First deployment:** Choose **Force Rebuild**

### 6.2 Monitor Build Process

Coolify will show real-time logs:

```
→ Cloning repository...
→ Building Docker image...
→ Running Dockerfile.backend...
→ Installing dependencies...
→ Creating container...
→ Starting container...
→ Running health check...
✓ Deployment successful!
```

**Build Time:** ~3-5 minutes (first build)

### 6.3 Verify Backend is Running

**Check Container Status:**
- Dashboard shows: ✓ Running (green indicator)
- Health check: ✓ Passing

**Check Logs:**
```
Click "Logs" tab
Should see: "🚀 Simple CDN server running on http://localhost:3000"
```

**Test Health Endpoint:**
```bash
# From server terminal
curl http://localhost:3000/healthz

# Expected response:
{"status":"healthy","timestamp":"2025-11-07T..."}
```

---

## Step 7: Frontend Deployment

### 7.1 Build Frontend Locally

Frontend must be built and deployed as static files.

**On your local machine:**
```bash
# Clone repository (if not already)
git clone https://github.com/XData-si/simple-cdn.git
cd simple-cdn/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Output: frontend/dist/
```

### 7.2 Option A: Deploy via Coolify Static Service

**Create New Service:**
1. In same project/environment
2. Click **+ New**
3. Select **Static Site**

**Configure:**
```
Name: cdn-xdata-frontend
Type: Static Files
Root Directory: /dist
```

**Upload Files:**
- Zip the `dist/` folder
- Upload via Coolify's file manager
- Or deploy from Git with build command

**Build Command (if deploying from Git):**
```bash
cd frontend && npm install && npm run build
```

**Output Directory:** `frontend/dist`

### 7.3 Option B: Serve via Coolify Proxy (Recommended)

**Use Coolify's built-in proxy to serve both frontend and backend:**

1. Upload frontend `dist/` files to server:
```bash
# From local machine
rsync -avz frontend/dist/ user@server:/var/www/cdn-xdata/
```

2. Configure Coolify proxy to serve static files (see Step 8.3)

### 7.4 Option C: Separate Static File Server

Use Coolify's file server or external service (Cloudflare Pages, Vercel, etc.) to serve frontend.

**Not recommended** - increases complexity.

---

## Step 8: Configure Domain & SSL

### 8.1 Configure Custom Domain

**In Backend Service:**
1. Click **Domains** tab
2. Click **+ Add Domain**
3. Enter: `cdn.xdata.si`
4. Click **Save**

**Coolify will:**
- Configure reverse proxy (Traefik)
- Route traffic to backend container
- Generate SSL certificate (Let's Encrypt)

### 8.2 DNS Configuration

Ensure DNS is pointing to your Coolify server:

```bash
# Check DNS
dig cdn.xdata.si +short
# Should return: your-server-ip

# Or
nslookup cdn.xdata.si
```

**DNS Records:**
```
Type: A
Name: cdn.xdata.si
Value: <your-server-ip>
TTL: 3600
```

**Wait for DNS propagation** (5-60 minutes).

### 8.3 Configure Proxy Routes

Coolify uses Traefik. You may need custom routing for frontend.

**Edit Proxy Configuration:**

1. In Coolify, go to **Settings → Proxy**
2. Add custom Traefik configuration (YAML):

```yaml
http:
  routers:
    cdn-xdata:
      rule: "Host(`cdn.xdata.si`)"
      entryPoints:
        - https
      service: cdn-xdata-service
      tls:
        certResolver: letsencrypt
      middlewares:
        - cdn-xdata-headers

  services:
    cdn-xdata-service:
      loadBalancer:
        servers:
          - url: "http://localhost:3000"

  middlewares:
    cdn-xdata-headers:
      headers:
        customResponseHeaders:
          X-Content-Type-Options: "nosniff"
          X-Frame-Options: "DENY"
          X-XSS-Protection: "1; mode=block"
          Strict-Transport-Security: "max-age=31536000; includeSubDomains"
```

**Or use Coolify's GUI:**
- Most routing is automatic
- Custom headers can be added in service settings

### 8.4 SSL Certificate

**Automatic (Recommended):**
Coolify automatically requests Let's Encrypt certificate when you add a domain.

**Monitor Certificate:**
1. Go to **Domains** tab
2. Check SSL status: ✓ Certificate Active

**Manual Certificate:**
If using custom certificate:
1. Go to **SSL Certificates**
2. Click **+ Add Certificate**
3. Upload `.crt` and `.key` files

### 8.5 Verify HTTPS

```bash
# Test HTTPS
curl -I https://cdn.xdata.si/healthz

# Check certificate
openssl s_client -connect cdn.xdata.si:443 -servername cdn.xdata.si
```

---

## Step 9: Verify Deployment

### 9.1 Backend Health Check

```bash
curl https://cdn.xdata.si/healthz

# Expected:
{
  "status": "healthy",
  "timestamp": "2025-11-07T12:00:00.000Z"
}
```

### 9.2 API Endpoints

```bash
# List API (should return empty or error - needs auth)
curl https://cdn.xdata.si/api/list

# Metrics
curl https://cdn.xdata.si/metrics
```

### 9.3 Frontend

Open browser:
```
https://cdn.xdata.si
```

**Expected:**
- Login page loads
- No console errors
- Can attempt login

### 9.4 Upload Test

1. Login with admin credentials
2. Upload a test image (JPG/PNG/SVG)
3. Copy public URL
4. Access URL in browser (should load image)

**Test URL format:**
```
https://cdn.xdata.si/cdn/filename.jpg
```

### 9.5 Full Verification Checklist

- [ ] Backend container running (green status)
- [ ] Health check passing
- [ ] Domain resolving to server
- [ ] HTTPS working (SSL certificate valid)
- [ ] Frontend loads without errors
- [ ] Can login to admin panel
- [ ] Can upload files
- [ ] Can access uploaded files via public URL
- [ ] Thumbnails generate correctly
- [ ] All API endpoints responding

---

## GitHub Actions CI/CD

**Automate deployments with GitHub Actions!** Every push to the `main` branch automatically builds and deploys your application to Coolify.

### Benefits

✅ **Automatic Deployment** - Push to `main` → Coolify deploys
✅ **Docker Image Registry** - Images stored in GitHub Container Registry (ghcr.io)
✅ **Build Caching** - Faster subsequent builds
✅ **Version Control** - Every deployment linked to a commit
✅ **Manual Triggers** - Deploy any branch on-demand

### Architecture

```
┌─────────────────┐
│  Push to main   │
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│   GitHub Actions        │
│  1. Build Docker Image  │
│  2. Push to ghcr.io    │
│  3. Trigger Coolify    │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│   Coolify Platform      │
│  1. Pull new image      │
│  2. Restart container   │
│  3. Health check        │
└─────────────────────────┘
```

### Setup Instructions

#### 1. Get Coolify Webhook URL

In Coolify Dashboard:

1. Go to your **CDN XData** service
2. Click **Webhooks** tab
3. Click **+ Add Webhook** or find existing webhook
4. Copy the webhook URL (looks like):
   ```
   https://coolify.yourdomain.com/api/v1/deploy?uuid=abc-123-def-456&token=xyz789
   ```

#### 2. Get Coolify API Token

In Coolify Dashboard:

1. Go to **Settings** → **API Tokens**
2. Click **Generate New Token**
3. Name it: `GitHub Actions Deploy`
4. Copy the generated token (shows only once!)

#### 3. Add GitHub Secrets

Go to your repository:

```
https://github.com/XData-si/simple-cdn/settings/secrets/actions
```

Click **"New repository secret"** and add:

**COOLIFY_WEBHOOK**
```
Value: https://coolify.yourdomain.com/api/v1/deploy?uuid=abc-123-def-456&token=xyz789
```

**COOLIFY_TOKEN**
```
Value: <paste-api-token-here>
```

#### 4. Configure Coolify for Docker Images

In Coolify service configuration:

1. Go to **General** tab
2. Set **Build Pack**: `Docker Image`
3. Set **Image**: `ghcr.io/xdata-si/simple-cdn:latest`
4. Set **Pull Policy**: `Always` (pull image on every deployment)
5. Click **Save**

**Important:** Change from Dockerfile build to Docker Image deployment!

#### 5. Verify Workflow File

The workflow file `.github/workflows/coolify-deploy.yml` is already configured:

```yaml
name: Deploy to Coolify

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'docker/Dockerfile.backend'

jobs:
  build-and-deploy:
    steps:
      - Build Docker image
      - Push to ghcr.io
      - Trigger Coolify webhook
```

**Triggers:**
- ✅ Push to `main` branch
- ✅ Changes in `backend/` directory
- ✅ Changes in `docker/Dockerfile.backend`
- ✅ Manual workflow dispatch

### Usage

#### Automatic Deployment

Simply push to main:

```bash
git add .
git commit -m "Update backend API"
git push origin main
```

**What happens:**
1. GitHub Actions builds Docker image
2. Pushes to `ghcr.io/xdata-si/simple-cdn:latest`
3. Triggers Coolify webhook
4. Coolify pulls new image and restarts container
5. Health check verifies deployment

#### Manual Deployment

Via GitHub UI:

1. Go to **Actions** tab
2. Select **Deploy to Coolify**
3. Click **Run workflow**
4. Choose branch (default: `main`)
5. Click **Run workflow** button

Via `gh` CLI:

```bash
gh workflow run coolify-deploy.yml
```

#### Monitor Deployment

**GitHub Actions:**
```
https://github.com/XData-si/simple-cdn/actions
```

Click on running workflow to see:
- Build logs
- Push to registry status
- Webhook trigger result

**Coolify Dashboard:**
- Service page shows deployment status
- **Logs** tab shows container restart
- **Deployments** tab shows deployment history

### Deployment Flow

```
1. Developer pushes code to main
   ↓
2. GitHub Actions triggered
   ↓
3. Docker image built (backend)
   ↓
4. Image pushed to ghcr.io/xdata-si/simple-cdn:latest
   ↓
5. Webhook triggered with Authorization
   ↓
6. Coolify receives webhook
   ↓
7. Coolify pulls latest image from ghcr.io
   ↓
8. Container restarted with new image
   ↓
9. Health check passes (/healthz)
   ↓
10. Deployment complete ✅
```

### Image Registry

Images are stored on **GitHub Container Registry** (ghcr.io):

```
ghcr.io/xdata-si/simple-cdn:latest
ghcr.io/xdata-si/simple-cdn:main-abc123  # commit SHA
ghcr.io/xdata-si/simple-cdn:main         # branch tag
```

**View images:**
```
https://github.com/orgs/XData-si/packages
```

**Pull image manually:**
```bash
docker pull ghcr.io/xdata-si/simple-cdn:latest
```

### Troubleshooting

#### Build Fails

**Error:** `docker build` fails in GitHub Actions

**Solution:**
- Check Dockerfile syntax: `docker/Dockerfile.backend`
- Verify all files exist (backend/src/*, backend/package.json)
- Check GitHub Actions logs for specific error

#### Push to Registry Fails

**Error:** `denied: permission_denied`

**Solution:**
- Verify workflow has `packages: write` permission
- Check GitHub token permissions in repository settings
- Ensure organization allows package publishing

#### Webhook Trigger Fails

**Error:** `curl: (22) The requested URL returned error: 401`

**Solution:**
- Verify `COOLIFY_TOKEN` is correct
- Check token hasn't expired in Coolify
- Regenerate token if needed

**Error:** `curl: (22) The requested URL returned error: 404`

**Solution:**
- Verify `COOLIFY_WEBHOOK` URL is correct
- Check service exists in Coolify
- Webhook may have been deleted - create new one

#### Coolify Doesn't Pull New Image

**Error:** Deployment triggered but container not updated

**Solution:**
1. Check Coolify service configuration
2. Verify **Build Pack** is set to `Docker Image`
3. Verify **Image** matches: `ghcr.io/xdata-si/simple-cdn:latest`
4. Set **Pull Policy** to `Always`
5. Check Coolify logs for pull errors

**Check image digest:**
```bash
# On server
docker inspect ghcr.io/xdata-si/simple-cdn:latest | grep -A 1 "Digest"

# Compare with ghcr.io
# Should match latest pushed image
```

#### Authentication Required for Image Pull

**Error:** Coolify can't pull private image

**Solution:** Configure registry credentials in Coolify:

1. Go to **Settings** → **Registries**
2. Add **GitHub Container Registry**:
   - Registry URL: `ghcr.io`
   - Username: `your-github-username`
   - Token: GitHub Personal Access Token with `read:packages`

**Or make image public:**
1. Go to package settings: https://github.com/orgs/XData-si/packages
2. Click **Package settings**
3. Change visibility to **Public**

### Advanced Configuration

#### Multi-Environment Deployments

Deploy to staging and production:

```yaml
# .github/workflows/coolify-staging.yml
on:
  push:
    branches: [develop]
env:
  COOLIFY_WEBHOOK: ${{ secrets.COOLIFY_WEBHOOK_STAGING }}

# .github/workflows/coolify-production.yml
on:
  push:
    branches: [main]
env:
  COOLIFY_WEBHOOK: ${{ secrets.COOLIFY_WEBHOOK_PRODUCTION }}
```

#### Build Multiple Architectures

```yaml
platforms: linux/amd64,linux/arm64
```

#### Deployment Notifications

Add Slack/Discord notification after deployment:

```yaml
- name: Notify Slack
  if: success()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"✅ CDN XData deployed successfully!"}'
```

### Best Practices

✅ **Always test locally** before pushing:
```bash
docker build -f docker/Dockerfile.backend -t test-cdn .
docker run -p 3000:3000 --env-file .env test-cdn
```

✅ **Use semantic versioning** for tags:
```yaml
type=semver,pattern={{version}}
type=semver,pattern={{major}}.{{minor}}
```

✅ **Monitor deployment status** in both GitHub Actions and Coolify

✅ **Keep secrets secure** - never commit tokens to repository

✅ **Enable notifications** for failed deployments

✅ **Backup before major updates** (see [Backup Strategy](#backup-strategy))

---

## Monitoring & Logs

### 10.1 View Logs

**In Coolify Dashboard:**
1. Go to service
2. Click **Logs** tab
3. Real-time logs appear

**Filter logs:**
- Search for keywords
- Filter by log level (info, warn, error)

**Download logs:**
- Click **Download Logs** button

### 10.2 Container Metrics

**In Coolify:**
- **CPU Usage**: View in dashboard
- **Memory Usage**: View in dashboard
- **Disk Usage**: Storage tab

**System Metrics:**
```bash
# SSH into server
ssh user@server

# View container stats
docker stats simple-cdn-backend

# View container logs
docker logs -f simple-cdn-backend --tail 100
```

### 10.3 Application Metrics

**Prometheus Metrics:**
```bash
curl https://cdn.xdata.si/metrics
```

**Key metrics:**
- `cdn_requests_total` - Total requests
- `cdn_errors_total` - Error count
- `cdn_requests_by_method` - Requests by HTTP method

### 10.4 Alerts (Optional)

**Setup alerts in Coolify:**
1. Go to **Notifications**
2. Add notification channel (Discord, Slack, Email)
3. Configure triggers:
   - Container stopped
   - Health check failed
   - Deployment failed

---

## Updates & Rollbacks

### 11.1 Update Application

**When you push to GitHub:**

**Option 1: Automatic Deployments**
1. Enable in service settings: **Auto Deploy on Push**
2. Coolify watches GitHub repo
3. Automatic deployment on git push to main

**Option 2: Manual Deployment**
1. In Coolify dashboard
2. Click **Deploy** → **Force Rebuild**
3. Coolify pulls latest code and rebuilds

### 11.2 Update Environment Variables

**Without Rebuild:**
1. Go to **Environment Variables**
2. Update values
3. Click **Save**
4. Click **Restart** (no rebuild needed)

### 11.3 Rollback to Previous Version

**In Coolify:**
1. Go to **Deployments** tab
2. View deployment history
3. Select previous successful deployment
4. Click **Redeploy**

**Or via Git:**
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback to specific commit
git reset --hard <commit-hash>
git push -f origin main
```

Then redeploy in Coolify.

### 11.4 Zero-Downtime Updates

Coolify supports blue-green deployments:
1. Builds new container
2. Runs health check
3. Switches traffic to new container
4. Removes old container

**Enable:**
- Ensure health check is configured
- Set appropriate health check start period (10s+)

---

## Backup Strategy

### 12.1 Storage Volume Backup

**Automated Backup Script:**

```bash
#!/bin/bash
# /opt/coolify-backups/backup-cdn-storage.sh

DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/backups/cdn-xdata"
VOLUME_PATH="/var/lib/docker/volumes/cdn-xdata-storage/_data"

mkdir -p "$BACKUP_DIR"

# Backup storage
tar -czf "$BACKUP_DIR/storage-$DATE.tar.gz" -C "$VOLUME_PATH" .

# Keep last 30 days
find "$BACKUP_DIR" -name "storage-*.tar.gz" -mtime +30 -delete

echo "Backup completed: storage-$DATE.tar.gz"
```

**Make executable and schedule:**
```bash
chmod +x /opt/coolify-backups/backup-cdn-storage.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /opt/coolify-backups/backup-cdn-storage.sh
```

### 12.2 Database Backup (Future)

If you add database later:
- Coolify has built-in backup for databases
- Configure in database service settings

### 12.3 Configuration Backup

**Backup Coolify configuration:**
```bash
# Environment variables (export from Coolify)
# Or backup .env files from Coolify data directory
```

### 12.4 Restore from Backup

```bash
# Stop container
docker stop simple-cdn-backend

# Restore volume
cd /var/lib/docker/volumes/cdn-xdata-storage/_data
rm -rf *
tar -xzf /backups/cdn-xdata/storage-20251107-020000.tar.gz -C .

# Start container
docker start simple-cdn-backend
```

**Or via Coolify:**
1. Upload backup to server
2. Extract to volume path
3. Restart service

---

## Troubleshooting

### 13.1 Container Won't Start

**Check logs:**
```bash
# In Coolify: Logs tab
# Or SSH:
docker logs simple-cdn-backend --tail 50
```

**Common issues:**
- Missing environment variables → Check all required vars
- Port conflict → Ensure port 3000 is free
- Build failed → Check Dockerfile syntax

### 13.2 Health Check Failing

**Debug:**
```bash
# Test health endpoint locally
docker exec simple-cdn-backend curl http://localhost:3000/healthz
```

**If fails:**
- Container not listening on port 3000
- Backend crashed on startup
- Health check path incorrect

**Fix:**
- Check logs for startup errors
- Verify PORT=3000 in environment
- Ensure health check path is `/healthz`

### 13.3 SSL Certificate Issues

**Certificate not generated:**
- DNS not pointing to server → Check DNS
- Port 80/443 blocked → Check firewall
- Coolify proxy not running → Restart Coolify

**Fix:**
```bash
# Check DNS
dig cdn.xdata.si +short

# Restart Coolify proxy
docker restart coolify-proxy

# Retry certificate in Coolify dashboard
```

### 13.4 Can't Upload Files

**Permission issues:**
```bash
# Check volume permissions
ls -la /var/lib/docker/volumes/cdn-xdata-storage/_data

# Fix permissions (if needed)
chown -R 1001:1001 /var/lib/docker/volumes/cdn-xdata-storage/_data
```

**Storage full:**
```bash
# Check disk space
df -h

# Check volume size
du -sh /var/lib/docker/volumes/cdn-xdata-storage/_data
```

### 13.5 Frontend Not Loading

**Static files missing:**
- Build frontend locally
- Upload to correct path
- Verify proxy configuration

**CORS errors:**
- Check BASE_URL matches domain
- Verify proxy headers are set

### 13.6 Slow Performance

**Check resources:**
```bash
# Container resources
docker stats simple-cdn-backend

# System resources
htop
```

**Optimization:**
- Increase container CPU/memory limits in Coolify
- Add caching layer (Redis)
- Optimize thumbnail generation

### 13.7 Can't Login

**Invalid credentials:**
- Verify ADMIN_PASSWORD_HASH is correct
- Regenerate hash and update environment variable
- Restart container

**Session issues:**
- Verify SESSION_SECRET is set
- Check cookies are enabled in browser
- Verify HTTPS is working (HTTP-only cookies)

### 13.8 Get Help

**Coolify Support:**
- Discord: https://discord.gg/coolify
- GitHub: https://github.com/coollabsio/coolify/issues
- Docs: https://coolify.io/docs

**CDN XData Support:**
- GitHub Issues: https://github.com/XData-si/simple-cdn/issues
- Email: admin@cognitiolabs.eu

---

## Production Checklist

Before going live:

### Security
- [ ] Strong admin password set
- [ ] SESSION_SECRET is random and secure (64+ chars)
- [ ] HTTPS enabled with valid certificate
- [ ] Firewall configured (only 80, 443 exposed)
- [ ] SSH key authentication (disable password auth)
- [ ] Regular security updates enabled

### Performance
- [ ] Container has adequate resources (2GB+ RAM)
- [ ] Storage volume has enough space (20GB+)
- [ ] CDN/caching configured (optional)
- [ ] Thumbnail generation tested
- [ ] Load testing performed

### Monitoring
- [ ] Health checks enabled and passing
- [ ] Logging configured
- [ ] Alerts set up (Discord/Slack/Email)
- [ ] Backup schedule configured
- [ ] Uptime monitoring (UptimeRobot, etc.)

### Functionality
- [ ] Can login to admin panel
- [ ] Can upload all file types (JPG, PNG, SVG)
- [ ] Thumbnails generate correctly
- [ ] Public URLs accessible
- [ ] SVG security working (no XSS)
- [ ] Rate limiting active

### Business
- [ ] Domain DNS configured correctly
- [ ] SSL certificate auto-renewal enabled
- [ ] Backup restoration tested
- [ ] Documentation updated
- [ ] Team trained on operations

---

## Quick Reference

### Coolify Commands

```bash
# Restart Coolify
systemctl restart coolify

# View Coolify logs
journalctl -u coolify -f

# Restart proxy
docker restart coolify-proxy
```

### Container Commands

```bash
# View containers
docker ps | grep cdn

# Container logs
docker logs -f simple-cdn-backend

# Execute command in container
docker exec simple-cdn-backend bun --version

# Restart container
docker restart simple-cdn-backend
```

### Service URLs

```
Backend API: https://cdn.xdata.si/api/
CDN Files: https://cdn.xdata.si/cdn/
Health: https://cdn.xdata.si/healthz
Metrics: https://cdn.xdata.si/metrics
Admin Panel: https://cdn.xdata.si/
```

---

## Additional Resources

- **Coolify Documentation**: https://coolify.io/docs
- **CDN XData Repository**: https://github.com/XData-si/simple-cdn
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Proxy Configuration**: [PROXY.md](PROXY.md)
- **API Reference**: [docs/API.md](docs/API.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

---

**CDN XData** - Developed by [Cognition Labs EU](https://cognitiolabs.eu)

For questions or support: admin@cognitiolabs.eu
