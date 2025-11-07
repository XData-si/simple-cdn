# Deployment Guide - CDN XData

Production deployment guide for **cdn.xdata.si** (Cognition Labs EU).

## Prerequisites

- Server with Docker and Docker Compose installed
- Domain `cdn.xdata.si` pointed to your server's IP
- Ports 80 and 443 open in firewall
- SSH access to server

## Production Setup

### 1. Clone Repository on Server

```bash
ssh user@your-server
cd /opt
git clone https://github.com/XData-si/simple-cdn.git cdn-xdata
cd cdn-xdata
```

### 2. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit configuration
nano .env
```

**Required settings:**

```env
# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<generate-with-bun>

# Domain
BASE_URL=https://cdn.xdata.si

# Security
SESSION_SECRET=<random-64-char-string>

# Production mode
NODE_ENV=production
READONLY=false
ENABLE_METRICS=true
```

### 3. Generate Admin Password Hash

On your **local machine** (requires Bun):

```bash
cd backend
bun install
echo -n "your-secure-password" | bun run hash-password
```

Copy the hash output to `.env` on the server.

### 4. Configure Caddy for HTTPS

The Caddyfile is already configured for `cdn.xdata.si`. Caddy will automatically:
- Obtain Let's Encrypt SSL certificate
- Enable HTTP/3
- Redirect HTTP to HTTPS
- Renew certificates automatically

**No manual SSL configuration needed!**

### 5. Start Services

```bash
# Build and start in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 6. Verify Deployment

```bash
# Health check
curl https://cdn.xdata.si/healthz

# Should return:
# {"status":"healthy","timestamp":"..."}
```

**Access the admin panel:**
- https://cdn.xdata.si

## DNS Configuration

Point your domain to the server:

```
A Record:
cdn.xdata.si -> <your-server-ip>

AAAA Record (optional IPv6):
cdn.xdata.si -> <your-server-ipv6>
```

**Wait for DNS propagation** (5-60 minutes).

## Firewall Configuration

Open required ports:

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable

# firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

## SSL Certificate

Caddy automatically obtains SSL certificates from Let's Encrypt. On first start:

1. Caddy detects domain `cdn.xdata.si` in Caddyfile
2. Performs ACME HTTP-01 challenge
3. Obtains certificate
4. Enables HTTPS automatically
5. Redirects HTTP → HTTPS

**Certificate renewal is automatic** (happens ~30 days before expiry).

View certificate info:
```bash
docker-compose exec proxy caddy list-certificates
```

## Storage Management

### Backup Files

```bash
# Create backup
docker-compose exec backend tar -czf /tmp/storage-backup.tar.gz /app/storage
docker cp simple-cdn-backend:/tmp/storage-backup.tar.gz ./storage-backup-$(date +%Y%m%d).tar.gz

# Or directly
docker cp simple-cdn-backend:/app/storage ./storage-backup-$(date +%Y%m%d)
```

### Restore from Backup

```bash
# Stop services
docker-compose down

# Restore
docker cp ./storage-backup-20251106 simple-cdn-backend:/app/storage

# Start services
docker-compose up -d
```

### Automated Backups (cron)

Create `/opt/cdn-xdata/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/cdn-xdata"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"

docker cp simple-cdn-backend:/app/storage "$BACKUP_DIR/storage-$DATE"
tar -czf "$BACKUP_DIR/storage-$DATE.tar.gz" -C "$BACKUP_DIR" "storage-$DATE"
rm -rf "$BACKUP_DIR/storage-$DATE"

# Keep only last 30 days
find "$BACKUP_DIR" -name "storage-*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/storage-$DATE.tar.gz"
```

Add to crontab:
```bash
chmod +x /opt/cdn-xdata/backup.sh

# Daily backup at 2 AM
crontab -e
0 2 * * * /opt/cdn-xdata/backup.sh >> /var/log/cdn-backup.log 2>&1
```

## Monitoring

### Health Check

```bash
# External monitoring
curl https://cdn.xdata.si/healthz

# Add to monitoring service (UptimeRobot, Pingdom, etc.)
```

### Metrics (Prometheus)

```bash
curl https://cdn.xdata.si/metrics
```

Configure Prometheus to scrape metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'cdn-xdata'
    static_configs:
      - targets: ['cdn.xdata.si']
    metrics_path: '/metrics'
    scheme: https
```

### Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Follow with timestamps
docker-compose logs -f -t backend
```

**Structured JSON logs** are written to stdout/stderr.

## Updates

### Update Application

```bash
cd /opt/cdn-xdata

# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Verify
docker-compose ps
docker-compose logs -f
```

### Update Docker Images

```bash
# Pull latest base images
docker-compose pull

# Rebuild
docker-compose up -d --build
```

## Performance Tuning

### Increase Upload Limit

Edit `.env`:
```env
MAX_UPLOAD_SIZE=52428800  # 50MB
```

Restart:
```bash
docker-compose restart backend
```

### Adjust Rate Limiting

Edit `.env`:
```env
RATE_LIMIT_REQUESTS=200    # requests
RATE_LIMIT_WINDOW=60000    # milliseconds (1 min)
```

### Storage Quota

Currently unlimited. To add quota, modify `backend/src/services/storage-local.ts`.

## Security

### Read-Only Mode

Enable during maintenance:
```env
READONLY=true
```

Users can browse but not upload/delete.

### Change Admin Password

```bash
# Generate new hash locally
echo -n "new-password" | bun run hash-password

# Update .env on server
ADMIN_PASSWORD_HASH=<new-hash>

# Restart
docker-compose restart backend
```

### Firewall Rules

Restrict access to metrics endpoint:

```bash
# Allow only from monitoring server
sudo ufw allow from <monitoring-ip> to any port 443 proto tcp
```

Or remove metrics endpoint by setting in `.env`:
```env
ENABLE_METRICS=false
```

## Troubleshooting

### SSL Certificate Issues

```bash
# Check Caddy logs
docker-compose logs proxy | grep -i "certificate\|acme\|tls"

# Verify DNS
dig cdn.xdata.si +short

# Test ACME challenge
curl http://cdn.xdata.si/.well-known/acme-challenge/test
```

**Common issues:**
- DNS not propagated → Wait longer
- Port 80 closed → Firewall blocking HTTP challenge
- Previous cert exists → Remove Caddy data volume

### Service Won't Start

```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs backend
docker-compose logs proxy

# Check .env configuration
cat .env | grep -v "PASSWORD"
```

### High Memory Usage

```bash
# Check container stats
docker stats simple-cdn-backend

# View memory usage
docker-compose exec backend ps aux
```

### Storage Full

```bash
# Check disk usage
df -h

# Check storage volume
docker-compose exec backend du -sh /app/storage

# Remove old thumbnails
docker-compose exec backend find /app/storage/.thumbnails -mtime +90 -delete
```

## Contact & Support

**Cognition Labs EU**
- Website: https://cognitiolabs.eu
- CDN: https://cdn.xdata.si
- Email: admin@cognitiolabs.eu

For technical issues, check:
1. Logs: `docker-compose logs -f`
2. Health: `curl https://cdn.xdata.si/healthz`
3. Metrics: `curl https://cdn.xdata.si/metrics`
