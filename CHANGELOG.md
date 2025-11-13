# Changelog

All notable changes to CDN XData will be documented in this file.

## [1.2.0] - 2025-11-13

### Added - CI/CD & Deployment Automation

#### GitHub Actions CI/CD for Coolify
- ✅ **.github/workflows/coolify-deploy.yml** - Automated deployment workflow
  - Builds Docker image on push to main (backend changes only)
  - Pushes to GitHub Container Registry (ghcr.io/xdata-si/simple-cdn)
  - Triggers Coolify webhook for automatic deployment
  - Includes build caching for faster subsequent builds
  - Multi-tag support (latest, branch, commit SHA)
- ✅ **COOLIFY.md - GitHub Actions CI/CD section** (350+ lines)
  - Complete setup instructions (webhook URL, API token, secrets)
  - Architecture diagram (GitHub Actions → ghcr.io → Coolify)
  - Deployment flow (10-step process)
  - Image registry configuration
  - Comprehensive troubleshooting guide
  - Advanced configuration (multi-environment, notifications)
  - Best practices

**Required GitHub Secrets:**
- `COOLIFY_WEBHOOK` - Webhook URL from Coolify service
- `COOLIFY_TOKEN` - API token from Coolify settings

**Coolify Configuration:**
- Build Pack: Docker Image (not Dockerfile)
- Image: ghcr.io/xdata-si/simple-cdn:latest
- Pull Policy: Always

#### Netlify Deployment (Frontend)
- ✅ **netlify.toml** - Netlify configuration
  - Build settings for frontend
  - SPA routing redirects
  - Security headers (X-Frame-Options, CSP, etc.)
  - Asset caching (1 year for /assets/*)
- ✅ **.github/workflows/netlify-deploy.yml** - Netlify deployment workflow
  - Automatic deployment on push to main (frontend changes only)
  - Deploy previews for pull requests
  - Conditional deployment (skips if credentials not configured)
  - Helpful setup instructions when credentials missing
- ✅ **NETLIFY.md** - Complete deployment guide (735+ lines)
  - Architecture overview (Netlify frontend + remote backend)
  - Setup instructions (Netlify account, GitHub secrets)
  - Frontend environment configuration
  - Custom domain setup
  - CORS configuration for backend
  - Comprehensive troubleshooting

**Architecture:**
```
Frontend (Netlify CDN) → API calls → Backend (cdn.xdata.si:3000)
```

**Required GitHub Secrets (Optional):**
- `NETLIFY_AUTH_TOKEN` - Personal access token from Netlify
- `NETLIFY_SITE_ID` - Site ID from Netlify dashboard

#### Frontend Environment Variables
- ✅ **frontend/.env.example** - Environment variable template
- ✅ **frontend/.env.production** - Production API URL configuration
- ✅ **frontend/src/api/client.ts** - Support for `VITE_API_BASE_URL`
  ```typescript
  private baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  ```

### Fixed

#### TypeScript Build Error
- ✅ **frontend/src/vite-env.d.ts** - Vite TypeScript definitions
  - Fixed: "Property 'env' does not exist on type 'ImportMeta'"
  - Added ImportMetaEnv interface with VITE_API_BASE_URL
  - Added ImportMeta interface with env property
- ✅ **frontend/package-lock.json** - Added for reproducible builds (205 packages)

**Build Results:**
```
✓ TypeScript compilation passes
✓ Vite build succeeds (843ms)
✓ Optimized bundles: 181 kB total (gzip: 59 kB)
```

#### Netlify Workflow Conditional Deployment
- ✅ Added credential check before deployment
- ✅ Gracefully skips deployment if secrets not configured
- ✅ Shows helpful setup instructions
- ✅ Frontend build always runs (verifies compilation)

### Documentation

#### Updated Documentation
- ✅ **README.md**
  - Added "Deploy to Coolify" badge
  - Added CI/CD to features list
  - Added CI/CD to tech stack
  - Added automated deployments section
  - Updated deployment options with CI/CD references
- ✅ **QUICKSTART.md**
  - Added three password generation options:
    - Option A: Using Bun (recommended)
    - Option B: Using Node.js (if Bun not installed)
    - Option C: Quick test credentials (admin/admin123)
  - Updated access URLs (port 3000, not 8080)
  - Added frontend development vs production notes
- ✅ **CLAUDE.md**
  - Added latest updates section (2025-11-13)
  - Listed new files and features
  - Configuration status (credentials, secrets)
  - Reference to SESSION_SUMMARY.md
- ✅ **SESSION_SUMMARY.md** - Complete session documentation
  - Implementation details
  - Repository state
  - Configuration requirements
  - Deployment options comparison
  - Commands reference
  - Next steps

### Configuration

#### Development Environment
- ✅ **.env** - Created from .env.example with test credentials
  ```env
  ADMIN_USERNAME=admin
  ADMIN_PASSWORD_HASH=<argon2id-hash-for-admin123>
  SESSION_SECRET=dev-secret-change-in-production-min32chars
  BASE_URL=http://localhost:3000
  NODE_ENV=development
  ```

**Test Credentials (Development Only):**
- Username: `admin`
- Password: `admin123`
- ⚠️ **Must change in production!**

### GitHub Actions Workflows

**3 Active Workflows:**
1. **Tests** - Backend tests, frontend build, Docker validation
2. **Deploy to Coolify** - ⚠️ Waiting for GitHub secrets
3. **Deploy to Netlify** - ✅ Conditional (skips if no credentials)

### Statistics

- **Commits:** 5 new commits this release
- **New Files:** 9 files added
- **Modified Files:** 4 files updated
- **Documentation:** 2 new complete guides (1,085+ lines)
- **Lines Added:** ~2,000+ lines (documentation + configuration)

### Based on Documentation

- Coolify CI/CD: https://coolify.io/docs/knowledge-base/git/github/github-actions
- GitHub example: https://github.com/andrasbacsai/github-actions-with-coolify

---

## [1.1.0] - 2025-11-07

### Changed - **BREAKING CHANGE**

#### Removed Internal Caddy Proxy
- ⚠️ **Breaking**: Removed Caddy proxy container from `docker-compose.yml`
- Backend now exposes port 3000 directly
- Requires external proxy (Caddy, Nginx, or Apache) for production
- Frontend must be built and deployed separately to proxy's web root

**Migration Required:**
1. Setup external proxy on your server
2. Build frontend: `cd frontend && npm run build`
3. Deploy frontend to proxy's web root (e.g., `/var/www/cdn-xdata/frontend/dist/`)
4. Configure proxy to serve frontend and proxy API/CDN to backend port 3000
5. Update `.env`: `BASE_URL=https://cdn.xdata.si`

#### Added
- ✅ **PROXY.md** - Complete proxy configuration guide
  - Caddy configuration example
  - Nginx configuration example
  - Apache configuration example
  - SSL/TLS setup instructions
  - Troubleshooting guide

#### Updated Documentation
- ✅ README.md - Updated tech stack and deployment sections
- ✅ DEPLOYMENT.md - Added external proxy setup steps
- ✅ QUICKSTART.md - Updated for external proxy architecture

**Reason**: Production server already has proxy running. This change allows CDN XData to work alongside other services behind a shared proxy.

---

## [1.0.0] - 2025-11-06

### Added - Initial Release

#### Core Features
- ✅ Production-ready image CDN service
- ✅ Public CDN access for JPG, PNG, SVG files
- ✅ Admin authentication with Argon2id password hashing
- ✅ Session-based authentication (HTTP-only cookies)
- ✅ Automatic thumbnail generation for JPG/PNG
- ✅ SVG sanitization and security (CSP headers)
- ✅ ETag-based caching with conditional requests
- ✅ Range request support for partial content
- ✅ Rate limiting for write operations
- ✅ Health check endpoint
- ✅ Prometheus metrics endpoint

#### Backend (Bun + TypeScript)
- ✅ Fast HTTP server with routing
- ✅ Local filesystem storage adapter
- ✅ Structured JSON logging with request IDs
- ✅ Path traversal protection
- ✅ File type validation (allowlist)
- ✅ Configurable upload size limits
- ✅ Automatic session cleanup
- ✅ Read-only mode support

#### Frontend (React + Vite)
- ✅ Clean, minimal admin UI
- ✅ Login/logout functionality
- ✅ File browser with breadcrumb navigation
- ✅ Grid view with thumbnails
- ✅ Drag & drop upload
- ✅ One-click URL copying
- ✅ Bulk selection and delete
- ✅ Folder creation
- ✅ Keyboard shortcuts (Enter, Delete, Space)
- ✅ Accessibility features (ARIA labels, focus styles)
- ✅ Responsive design

#### Infrastructure
- ✅ Docker multi-stage builds
- ✅ Caddy reverse proxy with automatic HTTPS
- ✅ docker-compose orchestration
- ✅ Non-root containers
- ✅ Health checks
- ✅ Volume mounts for persistent storage

#### Branding (Cognition Labs EU)
- ✅ Service name: "CDN XData"
- ✅ Domain: cdn.xdata.si
- ✅ Company attribution throughout UI
- ✅ Gradient logo effect
- ✅ Footer with company links
- ✅ Meta tags optimization

#### Documentation
- ✅ README.md - Complete project documentation
- ✅ QUICKSTART.md - 5-minute setup guide
- ✅ DEPLOYMENT.md - Production deployment guide
- ✅ API.md - Complete API reference
- ✅ DECISIONS.md - Architecture decision record
- ✅ BRANDING.md - Brand identity guidelines
- ✅ IMPLEMENTATION_SUMMARY.md - Development summary
- ✅ CLAUDE.md - AI assistant context
- ✅ CHANGELOG.md - This file

#### Testing
- ✅ Unit tests for path utilities
- ✅ Unit tests for SVG sanitizer
- ✅ Unit tests for ETag generation
- ✅ Test framework configured (Bun test)

#### Configuration
- ✅ Environment variable configuration
- ✅ .env.example template
- ✅ Automated setup scripts (bash, PowerShell)
- ✅ Caddyfile for reverse proxy
- ✅ docker-compose.yml

### Technical Specifications
- **Backend Runtime**: Bun (< 100ms cold start, ~30MB memory)
- **Frontend Build**: Vite (optimized production bundles)
- **Reverse Proxy**: Caddy 2 (HTTP/3, automatic HTTPS)
- **Image Processing**: Sharp (libvips-based)
- **Docker Images**: ~90MB backend, ~50MB proxy (Alpine-based)
- **API Endpoints**: 13 total (5 public, 8 protected)
- **Lines of Code**: ~3,500+

### Security
- ✅ Argon2id password hashing (memory-hard)
- ✅ HTTP-only, Secure, SameSite cookies
- ✅ Path traversal prevention
- ✅ SVG XSS protection
- ✅ Rate limiting (per-IP)
- ✅ CORS configuration
- ✅ Security headers (CSP, HSTS, X-Frame-Options)

### Performance
- ✅ P95 < 50ms for cached requests
- ✅ Immutable asset caching (1 year)
- ✅ ETag-based conditional requests
- ✅ Compression (Brotli/Gzip via Caddy)
- ✅ Streaming file responses

## Roadmap (Future Versions)

### [1.1.0] - Planned
- [ ] S3-compatible storage adapter
- [ ] WebP/AVIF derivative generation
- [ ] Image optimization on upload
- [ ] Folder move operation
- [ ] Search/filter functionality

### [1.2.0] - Planned
- [ ] OAuth authentication support
- [ ] Multi-user support
- [ ] User roles and permissions
- [ ] Audit log for all operations
- [ ] Advanced metrics dashboard

### [1.3.0] - Planned
- [ ] Signed purge webhook
- [ ] Read-only token view (temporary sharing)
- [ ] CLI for bulk operations
- [ ] Image transformation API (resize, crop)
- [ ] CDN cache control interface

---

**CDN XData** - Developed by [Cognition Labs EU](https://cognitiolabs.eu)
