# CDN XData

**Professional image CDN service by Cognition Labs EU**

Production-ready image CDN service running at **https://cdn.xdata.si** that serves JPG, PNG, and SVG files publicly while restricting upload/edit operations to authenticated users.

## Features

✅ **Public CDN Access** - Serve images publicly via `/cdn/*` with optimized cache headers
✅ **Admin Panel** - Clean, intuitive GUI for file management
✅ **Thumbnails** - Automatic thumbnail generation for JPG/PNG images
✅ **SVG Security** - Sanitization and CSP headers to prevent XSS
✅ **Performance** - ETag, Cache-Control, range requests, compression
✅ **Docker Ready** - Complete Docker setup with Caddy reverse proxy
✅ **File Operations** - Upload, delete, rename, move, create folders
✅ **Drag & Drop** - Intuitive upload experience
✅ **URL Copying** - One-click copy of static URLs and `<img>` tags
✅ **Keyboard Shortcuts** - Enter (open), Delete (delete), Ctrl/Cmd+C (copy URL)
✅ **Accessibility** - ARIA labels, keyboard navigation, focus styles

## Tech Stack

- **Backend**: Bun + TypeScript (fast, low memory, < 100ms cold start)
- **Frontend**: React + Vite (modern, fast development)
- **Reverse Proxy**: Caddy (automatic HTTPS, HTTP/3)
- **Storage**: Local filesystem (S3-compatible backend support planned)
- **Authentication**: Argon2id password hashing, HTTP-only cookies

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Bun](https://bun.sh/) (for local development)

### 1. Clone and Configure

```bash
git clone https://github.com/XData-si/simple-cdn.git
cd simple-cdn
cp .env.example .env
```

### 2. Generate Admin Password

```bash
cd backend
bun install
echo -n "your-secure-password" | bun run hash-password
```

Copy the generated hash to your `.env` file:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<paste-hash-here>
SESSION_SECRET=<generate-random-32-char-string>
BASE_URL=http://localhost:8080
```

### 3. Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Application

**Development (local):**
- **Admin Panel**: http://localhost:8080/
- **CDN (public)**: http://localhost:8080/cdn/*
- **API**: http://localhost:8080/api/*
- **Health Check**: http://localhost:8080/healthz
- **Metrics**: http://localhost:8080/metrics

**Production:**
- **Admin Panel**: https://cdn.xdata.si/
- **CDN (public)**: https://cdn.xdata.si/cdn/*
- **Company**: https://cognitiolabs.eu

## Development

### Backend Development

```bash
cd backend
bun install
bun dev
```

Server runs on http://localhost:3000

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173 with API proxy

### Running Tests

```bash
cd backend
bun test
```

### Build for Production

```bash
# Backend (containerized via Docker)
docker build -f docker/Dockerfile.backend -t simple-cdn-backend .

# Frontend
cd frontend
npm run build
# Output: frontend/dist/
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ADMIN_USERNAME` | Admin username | `admin` | Yes |
| `ADMIN_PASSWORD_HASH` | Argon2 password hash | - | Yes |
| `SESSION_SECRET` | Secret for session signing | - | Yes |
| `STORAGE_TYPE` | Storage backend (`local` or `s3`) | `local` | No |
| `STORAGE_ROOT` | Local storage directory | `/app/storage` | No |
| `BASE_URL` | Public base URL for generating links | `https://cdn.xdata.si` | Yes |
| `PORT` | Backend server port | `3000` | No |
| `NODE_ENV` | Environment (`development` or `production`) | `production` | No |
| `READONLY` | Enable read-only mode | `false` | No |
| `ENABLE_METRICS` | Enable Prometheus metrics | `true` | No |
| `MAX_UPLOAD_SIZE` | Max file size in bytes | `10485760` (10MB) | No |
| `RATE_LIMIT_REQUESTS` | Rate limit requests per window | `100` | No |
| `RATE_LIMIT_WINDOW` | Rate limit window in ms | `60000` (1 min) | No |
| `THUMBNAIL_SIZE` | Thumbnail size (longest side) | `128` | No |
| `THUMBNAIL_QUALITY` | JPEG quality for thumbnails | `85` | No |
| `LOG_LEVEL` | Logging level | `info` | No |

## API Documentation

See [API.md](docs/API.md) for complete API reference.

### Quick Reference

**Public Endpoints:**
- `GET /cdn/{path}` - Serve static files
- `GET /api/list?path=...` - List files/folders
- `GET /api/thumbnail?path=...` - Get thumbnail

**Authentication:**
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Check session

**Admin Endpoints (require auth):**
- `POST /api/upload?path=...` - Upload file
- `POST /api/mkdir` - Create directory
- `POST /api/move` - Move file/folder
- `POST /api/rename` - Rename file/folder
- `DELETE /api/delete?path=...` - Delete file/folder

## Security

### SVG Handling
- Sanitization removes scripts and event handlers
- `Content-Security-Policy` header prevents inline scripts
- `X-Content-Type-Options: nosniff` prevents MIME sniffing

### Path Traversal Protection
- All paths normalized and validated
- `../` attempts rejected
- Allowlist of extensions (`.jpg`, `.jpeg`, `.png`, `.svg`)

### Authentication
- Argon2id password hashing (memory-hard, resistant to GPU attacks)
- HTTP-only, Secure, SameSite cookies
- 24-hour session expiry
- Automatic session cleanup

### Rate Limiting
- Applied to all write operations
- Configurable requests per time window
- Per-IP tracking

## Performance

### Caching Strategy
- **Immutable Assets**: `Cache-Control: public, max-age=31536000, immutable`
- **ETags**: Content-based for conditional requests
- **If-None-Match**: 304 responses for unchanged content
- **Range Requests**: Partial content support
- **Compression**: Brotli/Gzip via Caddy

### Optimization
- Thumbnails generated once, cached permanently
- Streaming file responses (no memory buffering)
- Efficient Bun runtime (low memory footprint)
- Small Docker images (Alpine-based, ~90MB backend)

## Monitoring

### Health Check
```bash
curl http://localhost:8080/healthz
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T12:00:00.000Z"
}
```

### Metrics (Prometheus format)
```bash
curl http://localhost:8080/metrics
```

Metrics include:
- `cdn_requests_total` - Total requests
- `cdn_errors_total` - Total errors
- `cdn_requests_by_method` - Requests by HTTP method

## Project Structure

```
simple-cdn/
├── backend/               # Bun backend
│   ├── src/
│   │   ├── server.ts      # Main entry point
│   │   ├── config.ts      # Configuration loader
│   │   ├── types.ts       # TypeScript definitions
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic (auth, storage, thumbnails)
│   │   ├── middleware/    # Rate limiting
│   │   └── utils/         # Helpers (logging, path, etag)
│   ├── tests/             # Unit tests
│   └── scripts/           # Utility scripts
├── frontend/              # React frontend
│   ├── src/
│   │   ├── pages/         # Login, Dashboard
│   │   ├── components/    # FileCard, Breadcrumb, UploadZone
│   │   ├── api/           # API client
│   │   └── App.tsx
│   └── dist/              # Build output
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── Caddyfile          # Reverse proxy config
│   └── nginx.conf
├── docs/
│   ├── prd.md             # Product requirements (Slovenian)
│   └── API.md             # API documentation
├── docker-compose.yml     # Multi-container setup
├── .env.example           # Environment template
├── DECISIONS.md           # Architecture decisions
├── CLAUDE.md              # AI assistant context
└── README.md              # This file
```

## Operational Tasks

### Backup Storage

```bash
# Backup uploaded files
docker cp simple-cdn-backend:/app/storage ./backup-$(date +%Y%m%d)

# Restore from backup
docker cp ./backup-20251106 simple-cdn-backend:/app/storage
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f proxy
```

### Update Application

```bash
git pull
docker-compose down
docker-compose up -d --build
```

### Enable HTTPS (Production)

1. Update `docker/Caddyfile`:
```caddyfile
yourdomain.com {
    # Caddy automatically handles HTTPS
    # ... rest of config
}
```

2. Update `docker-compose.yml` to expose port 443:
```yaml
ports:
  - "80:80"
  - "443:443"
```

3. Set `BASE_URL=https://yourdomain.com` in `.env`

## Troubleshooting

### Backend won't start
- Check `ADMIN_PASSWORD_HASH` is set in `.env`
- Verify `SESSION_SECRET` is at least 32 characters
- Check logs: `docker-compose logs backend`

### Uploads failing
- Check file size doesn't exceed `MAX_UPLOAD_SIZE`
- Verify file type is JPG, PNG, or SVG
- Check storage volume permissions

### Images not loading
- Verify files exist: `docker exec simple-cdn-backend ls -la /app/storage`
- Check `BASE_URL` matches your domain
- Verify Caddy is routing correctly: `docker-compose logs proxy`

### High memory usage
- Thumbnails are generated once and cached
- Check for large files being uploaded repeatedly
- Monitor with: `docker stats simple-cdn-backend`

## Production Deployment

For production deployment to **cdn.xdata.si**, see [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

**Quick production checklist:**
1. ✅ Point DNS to server
2. ✅ Configure `.env` with strong credentials
3. ✅ Caddy automatically handles SSL (Let's Encrypt)
4. ✅ Ports 80 and 443 open
5. ✅ Set `BASE_URL=https://cdn.xdata.si`

## License

MIT

## About

**CDN XData** is developed and maintained by **Cognition Labs EU**.

- Website: [cognitiolabs.eu](https://cognitiolabs.eu)
- CDN Service: [cdn.xdata.si](https://cdn.xdata.si)

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## Support

For issues and questions:
- Check [Troubleshooting](#troubleshooting) section
- Review [API.md](docs/API.md) for API details
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
- Contact: admin@cognitiolabs.eu
