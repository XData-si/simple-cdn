# External Proxy Configuration

CDN XData is designed to work behind an external reverse proxy (Nginx, Caddy, Apache, etc.) that handles:
- SSL/TLS termination
- Domain routing
- Static file serving (frontend)
- Request forwarding to backend

## Architecture

```
Internet → External Proxy (Port 80/443) → Backend (Port 3000)
           ↓
           Frontend (static files)
```

## Backend Service

The Docker container exposes port **3000** for the backend API.

**docker-compose.yml** ports:
```yaml
ports:
  - "${BACKEND_PORT:-3000}:3000"
```

## Proxy Configuration Examples

### Caddy (Recommended)

**Caddyfile** for `cdn.xdata.si`:

```caddyfile
cdn.xdata.si {
    # Logging
    log {
        output stdout
        format json
    }

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }

    # Serve frontend static files
    root * /var/www/cdn-xdata/frontend/dist
    encode gzip
    file_server

    # Proxy API and CDN requests to backend
    reverse_proxy /api/* localhost:3000
    reverse_proxy /cdn/* localhost:3000
    reverse_proxy /healthz localhost:3000
    reverse_proxy /metrics localhost:3000
}
```

### Nginx

**nginx.conf** for `cdn.xdata.si`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name cdn.xdata.si;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cdn.xdata.si;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/cdn.xdata.si/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cdn.xdata.si/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/cdn.xdata.si/chain.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend static files
    root /var/www/cdn-xdata/frontend/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy CDN requests to backend
    location /cdn/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /healthz {
        proxy_pass http://localhost:3000;
    }

    # Metrics
    location /metrics {
        proxy_pass http://localhost:3000;
        # Optional: restrict access
        # allow 192.168.1.0/24;
        # deny all;
    }
}
```

### Apache

**.htaccess** or **VirtualHost** config:

```apache
<VirtualHost *:443>
    ServerName cdn.xdata.si

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/cdn.xdata.si/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/cdn.xdata.si/privkey.pem

    # Security headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"

    # Frontend
    DocumentRoot /var/www/cdn-xdata/frontend/dist

    # Proxy backend requests
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3000/api/
    ProxyPassReverse /api/ http://localhost:3000/api/

    ProxyPass /cdn/ http://localhost:3000/cdn/
    ProxyPassReverse /cdn/ http://localhost:3000/cdn/

    ProxyPass /healthz http://localhost:3000/healthz
    ProxyPassReverse /healthz http://localhost:3000/healthz

    ProxyPass /metrics http://localhost:3000/metrics
    ProxyPassReverse /metrics http://localhost:3000/metrics

    # SPA fallback
    <Directory /var/www/cdn-xdata/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>
</VirtualHost>
```

## Frontend Deployment

Build and deploy frontend separately:

```bash
# Build frontend
cd frontend
npm install
npm run build

# Deploy to web root
sudo cp -r dist/* /var/www/cdn-xdata/frontend/dist/
```

## Backend Service

Start backend with Docker Compose:

```bash
cd /opt/cdn-xdata
docker-compose up -d
```

Backend will be accessible on `localhost:3000`.

## Port Configuration

You can change the exposed backend port in `.env`:

```env
BACKEND_PORT=3000
```

Or directly in docker-compose:
```bash
docker-compose up -d
```

## Health Checks

Your external proxy should monitor backend health:

```bash
curl http://localhost:3000/healthz
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-07T10:00:00.000Z"
}
```

## SSL/TLS Setup

### Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt install certbot

# For Nginx
sudo apt install python3-certbot-nginx
sudo certbot --nginx -d cdn.xdata.si

# For Apache
sudo apt install python3-certbot-apache
sudo certbot --apache -d cdn.xdata.si

# For Caddy
# Caddy handles SSL automatically via ACME
```

### Manual Certificate

```bash
# Generate certificate
sudo certbot certonly --standalone -d cdn.xdata.si

# Certificates location
/etc/letsencrypt/live/cdn.xdata.si/
├── fullchain.pem
├── privkey.pem
└── chain.pem
```

## Security Considerations

1. **Firewall**: Only expose ports 80 and 443 to internet
2. **Backend Port**: Keep port 3000 internal (localhost only)
3. **Headers**: Proxy must set `X-Real-IP` and `X-Forwarded-For`
4. **HTTPS**: Always use HTTPS in production
5. **HSTS**: Enable Strict-Transport-Security header
6. **Rate Limiting**: Consider adding rate limiting at proxy level

## Monitoring

Monitor backend via proxy:

```bash
# Health check
curl https://cdn.xdata.si/healthz

# Metrics (Prometheus)
curl https://cdn.xdata.si/metrics
```

## Troubleshooting

### Backend not accessible

```bash
# Check backend is running
docker ps | grep cdn-backend

# Check backend port
curl http://localhost:3000/healthz

# Check logs
docker logs simple-cdn-backend
```

### Frontend not loading

```bash
# Check frontend files exist
ls -la /var/www/cdn-xdata/frontend/dist/

# Check proxy logs
# Nginx: tail -f /var/log/nginx/error.log
# Caddy: docker logs caddy (if using Caddy container)
```

### SSL issues

```bash
# Test SSL configuration
openssl s_client -connect cdn.xdata.si:443

# Verify certificates
sudo certbot certificates

# Renew certificates
sudo certbot renew --dry-run
```

## Production Checklist

- [ ] External proxy installed and configured
- [ ] SSL certificates obtained and installed
- [ ] Frontend built and deployed to web root
- [ ] Backend running on port 3000
- [ ] Firewall configured (only 80, 443 exposed)
- [ ] DNS pointing to server
- [ ] Health check responding
- [ ] All routes working (/api, /cdn, frontend SPA)
- [ ] CORS headers configured correctly
- [ ] Security headers enabled
- [ ] Certificate auto-renewal configured

---

**For the complete docker-compose setup (including Caddy proxy), see the `docker/` directory for reference configurations.**
