# Running Island Bitcoin with Lightning-Server on Same VPS

This guide explains how to run both Island Bitcoin and Lightning-Server on the same VPS using Docker and Nginx.

## Architecture Overview

```
VPS Server
├── Nginx (Host) - Port 80/443
│   ├── yourdomain.com → Island Bitcoin (Docker)
│   └── lightning.yourdomain.com → Lightning-Server
├── Island Bitcoin (Docker)
│   ├── App Container (Port 3000 internal)
│   └── Redis Container
└── Lightning-Server (Host/Docker)
    └── Next.js App (Port 3001 or custom)
```

## Prerequisites

- VPS with Lightning-Server already running
- Docker and Docker Compose installed
- Nginx installed on host
- Domain names configured
- SSL certificates (Let's Encrypt)

## Step 1: Identify Lightning-Server Configuration

First, check how Lightning-Server is running:

```bash
# Check if it's using PM2
pm2 list

# Check if it's in Docker
docker ps

# Check what ports are in use
sudo lsof -i -P -n | grep LISTEN
```

Common Lightning-Server ports:
- Next.js app: Usually 3000 or 3001
- LND REST: 8080
- LND gRPC: 10009

## Step 2: Configure Island Bitcoin

### Option A: Using Multi-App Docker Compose

If you want everything managed by Docker:

```bash
cd islandbitcoin-web/public_html

# Use the multi-app compose file
cp docker-compose.multi-app.yml docker-compose.yml

# Update .env with non-conflicting port
echo "PORT=3000" >> .env
```

### Option B: Adjust Standard Docker Compose

If Lightning-Server uses port 3000, change Island Bitcoin:

```yaml
# In docker-compose.yml
services:
  app:
    ports:
      - "3002:3000"  # Map to different host port
```

## Step 3: Configure Nginx Reverse Proxy

### Install Nginx (if not already installed)

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/multi-app
```

Use this configuration:

```nginx
# Island Bitcoin - Main domain
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;  # Island Bitcoin
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Lightning Server - Subdomain
server {
    listen 80;
    server_name lightning.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lightning.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/lightning.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lightning.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;  # Lightning Server port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable Configuration

```bash
sudo ln -s /etc/nginx/sites-available/multi-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 4: Get SSL Certificates

```bash
# For Island Bitcoin
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For Lightning Server
sudo certbot --nginx -d lightning.yourdomain.com
```

## Step 5: Deploy Island Bitcoin

```bash
cd islandbitcoin-web/public_html

# Configure environment
cp .env.example .env
nano .env

# Deploy with Docker
docker compose up -d

# Check status
docker compose ps
docker compose logs -f
```

## Port Management Strategy

### Scenario 1: Lightning-Server on Host (PM2/Node)
- Lightning-Server: Port 3001 (or current port)
- Island Bitcoin: Port 3000 (Docker internal)
- Nginx: Routes based on domain

### Scenario 2: Both in Docker
- Use Docker networks for isolation
- Each app gets its own Redis if needed
- Nginx on host routes to containers

### Scenario 3: Path-based Routing
Instead of subdomains, use paths:
- `yourdomain.com/` → Island Bitcoin
- `yourdomain.com/lightning/` → Lightning Server

## Resource Optimization

### Memory Management
```bash
# Check current usage
free -h
docker stats

# Limit Docker memory if needed
# Add to docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 1G
```

### Shared Services
If both apps need Redis, you can share:
```yaml
# In docker-compose.yml
external_links:
  - shared-redis:redis
```

## Monitoring Both Apps

### Create monitoring script
```bash
nano ~/monitor-apps.sh
```

```bash
#!/bin/bash
echo "=== Lightning Server Status ==="
pm2 status || echo "Not using PM2"
curl -s http://localhost:3001/health || echo "Lightning Server not responding"

echo -e "\n=== Island Bitcoin Status ==="
docker compose ps
curl -s http://localhost:3000/api/health || echo "Island Bitcoin not responding"

echo -e "\n=== Nginx Status ==="
systemctl status nginx --no-pager | head -5

echo -e "\n=== Resource Usage ==="
free -h
df -h /
```

```bash
chmod +x ~/monitor-apps.sh
```

## Troubleshooting

### Port Conflicts
```bash
# Find what's using a port
sudo lsof -i :3000

# Change Island Bitcoin port in docker-compose.yml
ports:
  - "3002:3000"
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Memory Issues
```bash
# Add swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## Best Practices

1. **Use different domains/subdomains** for each app
2. **Monitor resource usage** regularly
3. **Set up log rotation** for both apps
4. **Use systemd** for Lightning-Server if not containerized
5. **Regular backups** of both applications
6. **Set resource limits** in Docker to prevent one app from consuming all resources

## Integration Opportunities

Since both apps are Bitcoin/Lightning related:
1. Share LND node connection
2. Use same BTCPay Server instance
3. Cross-link between apps
4. Share user authentication (future)

---

For questions specific to Lightning-Server, refer to its documentation.
For Island Bitcoin issues, see [DEPLOYMENT.md](./DEPLOYMENT.md).