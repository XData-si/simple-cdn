# Architecture Decision Record

## Tech Stack Selection

**Date**: 2025-11-06

### Backend: Bun + TypeScript

**Reasoning:**
- ✅ Extremely fast cold start (< 100ms) - exceeds < 1s requirement
- ✅ Low memory footprint (~30MB base)
- ✅ Built-in TypeScript support (no transpilation needed)
- ✅ Native ESM modules
- ✅ Fast file I/O (critical for CDN)
- ✅ Built-in HTTP server (no need for Fastify)
- ✅ Small Docker images possible (~90MB with alpine)
- ✅ Simple dependency management

**Trade-offs:**
- Bun is newer than Node.js (but stable since 1.0)
- Smaller ecosystem than Node.js (but can use npm packages)

### Frontend: React + Vite

**Reasoning:**
- ✅ Fast development experience
- ✅ Large ecosystem and community
- ✅ Modern build tooling with Vite
- ✅ Small production bundles with tree-shaking
- ✅ TypeScript support out of the box

### Reverse Proxy: Caddy

**Reasoning:**
- ✅ Automatic HTTPS with Let's Encrypt
- ✅ HTTP/3 support built-in
- ✅ Simple configuration (Caddyfile)
- ✅ Auto-renewal of certificates
- ✅ Small footprint
- ✅ HSTS and security headers easy to configure

### Storage Strategy

**Phase 1**: Local filesystem with volumes
**Phase 2**: S3-compatible backend (MinIO/AWS S3) via adapter pattern

### Authentication

- Argon2id for password hashing
- HTTP-only, Secure cookies for sessions
- Session storage in memory (simple Map) for MVP, Redis for production scaling

### Image Processing

- **sharp** library for thumbnail generation (fast, efficient, supports JPG/PNG)
- SVG sanitization with **dompurify** (isomorphic)

### Logging

- Structured JSON logs to stdout
- Request ID propagation through all operations
- Log levels: debug, info, warn, error

## Project Structure

```
simple-cdn/
├── backend/           # Bun backend
│   ├── src/
│   │   ├── server.ts       # Main entry point
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, logging, rate limiting
│   │   ├── services/       # Storage, thumbnails, auth
│   │   └── utils/          # Helpers
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/           # API client
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── Caddyfile
├── docker-compose.yml
├── .env.example
├── docs/
└── CLAUDE.md
```
