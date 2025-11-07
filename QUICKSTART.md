# Quick Start Guide - CDN XData

Get **CDN XData** by Cognition Labs EU running in **5 minutes**.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Bun](https://bun.sh/) installed (for password hashing)

## Step-by-Step

### 1. Clone and Enter Directory

```bash
git clone https://github.com/XData-si/simple-cdn.git
cd simple-cdn
```

### 2. Configure Environment

**Option A: Automated (Linux/macOS)**
```bash
bash setup.sh
```

**Option B: Manual**

```bash
# Copy template
cp .env.example .env

# Edit .env and set:
# - ADMIN_USERNAME (e.g., "admin")
# - SESSION_SECRET (random 32+ character string)
```

### 3. Generate Admin Password

```bash
cd backend
bun install
echo -n "your-secure-password" | bun run hash-password
```

Copy the output hash and paste it into `.env`:

```env
ADMIN_PASSWORD_HASH=$argon2id$v=19$m=65536,t=3,p=4$...paste-here...
```

### 4. Start Services

```bash
cd ..
docker-compose up -d
```

Wait ~30 seconds for services to start.

### 5. Access the Application

Open your browser:

**Admin Panel**: http://localhost:8080

Login with:
- Username: `admin` (or whatever you set in `.env`)
- Password: `your-secure-password` (from step 3)

## What's Running?

- **Backend API**: http://localhost:3000 (inside Docker)
- **Frontend + Proxy**: http://localhost:8080 (your access point)
- **Public CDN**: http://localhost:8080/cdn/*
- **Health Check**: http://localhost:8080/healthz

## First Upload

1. Login to http://localhost:8080
2. Drag and drop an image (JPG, PNG, or SVG)
3. Click "Copy URL" button
4. Share the public URL - **no authentication required!**

Example public URL: `http://localhost:8080/cdn/photo.jpg`

## View Logs

```bash
docker-compose logs -f
```

## Stop Services

```bash
docker-compose down
```

## Troubleshooting

### Can't access http://localhost:8080
- Check Docker is running: `docker ps`
- Check logs: `docker-compose logs proxy`

### Login fails
- Verify `ADMIN_PASSWORD_HASH` in `.env` matches your password
- Check backend logs: `docker-compose logs backend`

### Upload fails
- Check file is JPG, PNG, or SVG
- File size must be < 10MB (configurable via `MAX_UPLOAD_SIZE`)
- Check backend logs for errors

## Next Steps

- Read [README.md](README.md) for full documentation
- See [API.md](docs/API.md) for API reference
- Check [DECISIONS.md](DECISIONS.md) for architecture details

## Production Deployment

**CDN XData** is configured for production at **https://cdn.xdata.si**.

For production deployment:

1. **Set strong credentials** in `.env`
2. **Point DNS** to your server
3. **Set BASE_URL** to `https://cdn.xdata.si`
4. **Caddy handles HTTPS** automatically (Let's Encrypt)
5. **Backup storage** directory regularly

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete production guide.

---

**Developed by Cognition Labs EU**
- Website: [cognitiolabs.eu](https://cognitiolabs.eu)
- CDN: [cdn.xdata.si](https://cdn.xdata.si)
- Support: admin@cognitiolabs.eu

**Need help?** Check the [Troubleshooting](README.md#troubleshooting) section in README.md.
