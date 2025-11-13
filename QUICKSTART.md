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

**Option A: Using Bun (recommended)**
```bash
cd backend
bun install
echo -n "your-secure-password" | bun run hash-password
```

**Option B: Using Node.js (if Bun not installed)**
```bash
cd backend
npm install
node -e "import('@node-rs/argon2').then(({hash})=>hash('your-secure-password',{memoryCost:65536,timeCost:3,parallelism:4}).then(console.log))"
```

**Option C: Quick Test Credentials**
For development/testing, use these pre-generated credentials:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$argon2id$v=19$m=65536,t=3,p=4$JBt+ogxjtkcvc9i7vWnspg$nmqpzcWmr0XAcJ8XIbbBq+nE53MkeS3p9djSqgJ1pl4
# Password: admin123
```

⚠️ **Change in production!** Generate a secure password using Option A or B.

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

**Backend API**: http://localhost:3000
**Health Check**: http://localhost:3000/healthz

⚠️ **Note**: Backend runs on port 3000. For full application with frontend:
- **Development**: Run `cd frontend && npm run dev` (http://localhost:5173)
- **Production**: Deploy frontend to Netlify or serve via external proxy

See [PROXY.md](PROXY.md) for proxy setup or [NETLIFY.md](NETLIFY.md) for frontend deployment.

Login with:
- Username: `admin` (or whatever you set in `.env`)
- Password: `your-secure-password` (or `admin123` if using test credentials)

## What's Running?

- **Backend API**: http://localhost:3000 (Docker container)
- **Health Check**: http://localhost:3000/healthz

**Note**: For production, you need:
- External proxy (Caddy/Nginx/Apache) on ports 80/443
- Frontend built and deployed to web root
- See [PROXY.md](PROXY.md) for configuration

## First Upload (Production)

1. Login to https://cdn.xdata.si
2. Drag and drop an image (JPG, PNG, or SVG)
3. Click "Copy URL" button
4. Share the public URL - **no authentication required!**

Example public URL: `https://cdn.xdata.si/cdn/photo.jpg`

**For local testing**: Backend API is at http://localhost:3000 but you need a proxy to access the full application.

## View Logs

```bash
docker-compose logs -f
```

## Stop Services

```bash
docker-compose down
```

## Troubleshooting

### Can't access application
- Check backend is running: `docker ps | grep cdn-backend`
- Check backend logs: `docker-compose logs backend`
- Check external proxy is running and configured
- See [PROXY.md](PROXY.md) for proxy setup

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
