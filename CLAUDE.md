# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Latest Updates (2025-11-13)

**Session Summary:** See `SESSION_SUMMARY.md` for complete details of latest development session.

**Recent Additions:**
- ✅ **GitHub Actions CI/CD for Coolify** - Automated Docker builds and deployments
- ✅ **Netlify Deployment** - Frontend deployment with GitHub Actions
- ✅ **TypeScript Build Fix** - Added Vite environment type definitions
- ✅ **Development Credentials** - Test credentials setup (admin/admin123)
- ✅ **Updated Documentation** - QUICKSTART.md with 3 password generation options

**New Files:**
- `COOLIFY.md` - Coolify deployment guide with GitHub Actions CI/CD section
- `NETLIFY.md` - Netlify deployment guide (frontend only)
- `.github/workflows/coolify-deploy.yml` - Coolify deployment workflow
- `.github/workflows/netlify-deploy.yml` - Netlify deployment workflow
- `frontend/src/vite-env.d.ts` - Vite TypeScript definitions
- `SESSION_SUMMARY.md` - Detailed session documentation

**Configuration Status:**
- ✅ `.env` file created with test credentials (admin/admin123)
- ⚠️ GitHub secrets for Coolify not yet configured (COOLIFY_WEBHOOK, COOLIFY_TOKEN)
- ⚠️ GitHub secrets for Netlify optional (NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID)

## Project Overview

**CDN XData** - A production-ready image CDN service by **Cognition Labs EU** running in Docker that serves JPG, PNG, and SVG files publicly while restricting upload/edit operations to authenticated users.

**Production Domain**: https://cdn.xdata.si
**Company**: https://cognitiolabs.eu

**Current Status**: ✅ Fully implemented, branded, production-ready with CI/CD pipelines. Ready for production deployment after configuring Coolify secrets.

## Architecture

### Technology Stack
- **Backend**: Bun + TypeScript (fast cold start < 100ms, low memory ~30MB, native TypeScript)
- **Frontend**: React + Vite (modern tooling, fast development, small production bundles)
- **Reverse Proxy**: Caddy (automatic HTTPS with Let's Encrypt, HTTP/3, simple configuration)
- **Storage**: Local filesystem with pluggable adapter pattern (S3 support can be added)
- **Auth**: Argon2id password hashing, HTTP-only session cookies, single admin via .env
- **Image Processing**: Sharp library for thumbnails (fast libvips-based)
- **SVG Sanitization**: sanitize-html library

### Key Design Principles

1. **Public Read Access**: All GET requests to images/folders require no authentication
2. **Authenticated Write**: Upload, delete, rename, move, mkdir operations require login
3. **URL Structure**: `https://{BASE_URL}/cdn/{path/to/file.ext}` - clean, predictable URLs
4. **Thumbnails**: Auto-generate 128px thumbnails for JPG/PNG; store in `.thumbnails/` or S3
5. **SVG Security**: Proper Content-Type, strict CSP, sanitization on upload

### API Endpoints

**Public:**
- `GET /cdn/*` - Static image serving with cache headers
- `GET /api/list?path=...` - JSON listing (folders, files, sizes, URLs, thumbnail URLs)

**Admin (authenticated):**
- `POST /api/upload?path=...`
- `POST /api/mkdir` (path)
- `POST /api/move` (src, dst)
- `POST /api/rename` (path, newName)
- `DELETE /api/delete?path=...`

**System:**
- `GET /healthz` - Health check
- `GET /metrics` - Prometheus format (optional)

### Environment Configuration

Required ENV variables:
- `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`
- `STORAGE_ROOT` or `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- `BASE_URL` - For generating absolute URLs
- `READONLY=false/true` - Fallback mode

### Security Requirements

1. **Path Traversal**: Normalize paths, prevent `../` traversal
2. **File Type Allowlist**: Only jpg/jpeg/png/svg extensions
3. **SVG Handling**: `Content-Type: image/svg+xml`, strict CSP to disallow inline scripts
4. **Rate Limiting**: Apply to all write endpoints
5. **CORS**: `*` for GET on `/cdn/**`; write API only from GUI domain
6. **No Auth Tokens in URLs**: All public access, editing only via GUI

### Caching Strategy

- **Immutable Paths**: `Cache-Control: public, max-age=31536000, immutable`
- **ETags**: Generate from content hash
- **Conditional Requests**: Support `If-None-Match`, `If-Modified-Since`
- **Range Requests**: Support `Accept-Ranges` for large files
- **Compression**: Brotli/Gzip

### Performance Targets

- P95 < 50ms on cache hit
- Minimal RAM/CPU usage
- Cold start < 1s (especially with Go/Bun)
- Small Docker image (alpine/distroless, multi-stage build)

## Development Commands

### Backend (Bun)
```bash
cd backend
bun install                    # Install dependencies
bun dev                        # Run dev server with hot reload (port 3000)
bun src/server.ts              # Run production server
bun test                       # Run unit tests
bun test --watch               # Run tests in watch mode
bun run hash-password          # Generate Argon2 password hash
```

### Frontend (React + Vite)
```bash
cd frontend
npm install                    # Install dependencies
npm run dev                    # Run dev server with HMR (port 5173)
npm run build                  # Build for production (output: dist/)
npm run preview                # Preview production build
npm run lint                   # Run ESLint
```

### Docker
```bash
# Development
docker-compose up -d           # Start all services
docker-compose down            # Stop all services
docker-compose logs -f         # View logs
docker-compose logs backend    # View backend logs only

# Production build
docker build -f docker/Dockerfile.backend -t simple-cdn-backend .
docker build -f docker/Dockerfile.frontend -t simple-cdn-frontend .

# Rebuild after changes
docker-compose up -d --build
```

### Testing
```bash
cd backend
bun test                       # Run all unit tests
bun test path.test.ts          # Run specific test file
```

## Implemented GUI Features

✅ Login/logout with simple dashboard
✅ Folder navigation with breadcrumb
✅ Grid view with image cards showing: thumbnail, name, size
✅ Copy URL button (one-click copy to clipboard)
✅ Copy `<img>` tag button
✅ Drag & drop upload with file type validation
✅ Bulk selection (checkboxes) and bulk delete
✅ New folder creation (inline input)
✅ Keyboard shortcuts:
  - Enter: Open folder/file
  - Delete: Delete selected item
  - Space: Toggle selection
✅ ARIA labels for screen readers
✅ Focus styles for keyboard navigation
✅ Responsive design

## Testing Strategy

1. **Unit Tests**: Thumbnail generator, SVG sanitization
2. **Integration Tests**: Upload/list/delete flow
3. **Smoke Tests**: `/cdn/*` endpoints with cache headers verification

## Docker Setup

- Single Dockerfile with multi-stage build
- Healthcheck included
- Run as non-root user
- docker-compose.yml with volume mounts and .env support
- Reverse proxy container (Caddy/Nginx) in front with HTTP/3, TLS, HSTS

## Important Implementation Notes

- Stream large files; don't buffer entire content in memory
- Proper Content-Type headers (image/jpeg, image/png, image/svg+xml)
- Prevent file overwrite conflicts (offer rename on conflict)
- Structured JSON logging with request IDs
- Log levels: info/warn/error
- Optional quota support (max upload size, max total storage)

## Code Organization

### Backend Structure (`backend/src/`)
- **server.ts**: Main HTTP server, routing, middleware orchestration
- **config.ts**: Environment variable loading and validation
- **types.ts**: TypeScript interfaces and type definitions
- **routes/**:
  - `auth-routes.ts` - Login, logout, session check
  - `cdn-routes.ts` - Static file serving with cache headers
  - `api-routes.ts` - File operations (upload, delete, move, etc.)
- **services/**:
  - `auth.ts` - Password verification, session management
  - `storage-local.ts` - Local filesystem adapter
  - `thumbnail.ts` - Thumbnail generation with Sharp
  - `svg-sanitizer.ts` - SVG content sanitization
- **middleware/**:
  - `rate-limit.ts` - Per-IP rate limiting
- **utils/**:
  - `logger.ts` - Structured JSON logging
  - `path.ts` - Path normalization and validation
  - `etag.ts` - ETag generation and matching
  - `request-id.ts` - Unique request ID generation

### Frontend Structure (`frontend/src/`)
- **main.tsx**: Entry point
- **App.tsx**: Root component with routing and auth state
- **api/client.ts**: API client with all backend calls
- **pages/**:
  - `Login.tsx` - Login form
  - `Dashboard.tsx` - Main file management interface
- **components/**:
  - `Breadcrumb.tsx` - Path navigation
  - `FileCard.tsx` - Individual file/folder display
  - `UploadZone.tsx` - Drag & drop upload area

### Key Implementation Details

1. **Authentication Flow**: Login → Create session → Set HTTP-only cookie → All API calls include cookie
2. **Upload Flow**: Validate extension → Check size → Sanitize SVG if needed → Write to storage → Generate thumbnail
3. **CDN Serving**: Check cache headers (If-None-Match) → Stream file → Add cache/security headers
4. **Rate Limiting**: Per-IP counter with sliding window, automatic cleanup
5. **Thumbnails**: Generated on first request, cached in `.thumbnails/` directory
6. **Path Safety**: All paths normalized, `../` rejected, only allowlisted extensions

## Acceptance Criteria

✅ All criteria met:
1. Public GET to `/cdn/...` returns correct cache headers, ETag, Range, Content-Type
2. GUI allows login, folder browsing, thumbnail display with static URLs, all CRUD operations
3. SVG served safely (CSP enforced), SVG uploads sanitized or rejected if scripts detected
4. `docker-compose up -d` works out of the box
5. New user can upload image and share URL within 5 minutes of reading documentation

## Common Modifications

### Add New Storage Adapter (e.g., S3)
1. Create `backend/src/services/storage-s3.ts` implementing `StorageAdapter` interface
2. Update `backend/src/server.ts` to instantiate based on `STORAGE_TYPE` env var
3. Add S3 configuration to `backend/src/config.ts`

### Add New File Type
1. Add extension to `backend/src/utils/path.ts` `isAllowedExtension()`
2. Update `backend/src/routes/cdn-routes.ts` for proper Content-Type
3. Update frontend `UploadZone.tsx` validation

### Add OAuth Authentication
1. Add OAuth library (e.g., `arctic` for Bun)
2. Create new route in `backend/src/routes/auth-routes.ts`
3. Update session creation in `backend/src/services/auth.ts`
4. Add OAuth button to `frontend/src/pages/Login.tsx`
