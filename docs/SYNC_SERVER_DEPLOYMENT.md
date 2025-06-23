# Island Bitcoin Sync Server Production Deployment Guide

This guide covers multiple deployment options for the Island Bitcoin sync server in production.

## Overview

The sync server provides cross-browser configuration synchronization for the Island Bitcoin web app. It includes:
- Redis caching for performance
- API authentication
- Rate limiting
- CORS protection
- Full configuration sync support

## Prerequisites

- Node.js 20+ or Docker
- Redis server (optional but recommended)
- A domain with SSL certificate
- Basic knowledge of server administration

## Option 1: Deploy on a VPS (DigitalOcean, Linode, etc.)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Redis
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y
```

### 2. Deploy the Sync Server

```bash
# Clone the repository
git clone https://github.com/islandbitcoin/www.git
cd www/server

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
PORT=3001
API_SECRET=your-very-secure-api-key-here
REDIS_URL=redis://localhost:6379
NODE_ENV=production
EOF

# Start with PM2
pm2 start server.js --name island-bitcoin-sync
pm2 save
pm2 startup
```

### 3. Configure Nginx

Create Nginx configuration:

```nginx
# /etc/nginx/sites-available/sync.islandbitcoin.com
server {
    listen 80;
    server_name sync.islandbitcoin.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sync.islandbitcoin.com;

    ssl_certificate /etc/letsencrypt/live/sync.islandbitcoin.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sync.islandbitcoin.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
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

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/sync.islandbitcoin.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Certificate with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d sync.islandbitcoin.com
```

## Option 2: Deploy on Railway.app

Railway provides easy deployment with Redis included.

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Deploy
```bash
cd server
railway login
railway init
railway add redis
railway up
```

### 3. Set Environment Variables
In Railway dashboard, add:
- `API_SECRET`: Your secure API key
- `REDIS_URL`: Will be auto-populated by Railway

## Option 3: Deploy with Docker

### 1. Create docker-compose.yml

```yaml
version: '3.8'

services:
  sync-server:
    build: ./server
    container_name: island-bitcoin-sync
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - API_SECRET=${API_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    networks:
      - island-bitcoin

  redis:
    image: redis:7-alpine
    container_name: island-bitcoin-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    networks:
      - island-bitcoin

networks:
  island-bitcoin:
    driver: bridge

volumes:
  redis-data:
```

### 2. Create .env file
```bash
API_SECRET=your-very-secure-api-key-here
```

### 3. Deploy
```bash
docker-compose up -d
```

## Option 4: Deploy on Fly.io

### 1. Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Create fly.toml
```toml
app = "island-bitcoin-sync"
primary_region = "mia"  # Miami for Caribbean proximity

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3001"
  NODE_ENV = "production"

[services]
  internal_port = 3001
  protocol = "tcp"

  [[services.ports]]
    port = 443
    handlers = ["http", "tls"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

[services.concurrency]
  type = "connections"
  hard_limit = 25
  soft_limit = 20
```

### 3. Deploy
```bash
cd server
fly launch
fly secrets set API_SECRET=your-very-secure-api-key-here
fly redis create
fly redis attach island-bitcoin-redis
fly deploy
```

## Option 5: Deploy on Render.com

### 1. Create render.yaml
```yaml
services:
  - type: web
    name: island-bitcoin-sync
    env: node
    region: oregon
    plan: starter
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: API_SECRET
        generateValue: true
      - key: REDIS_URL
        fromService:
          type: redis
          name: island-bitcoin-redis
          property: connectionString

  - type: redis
    name: island-bitcoin-redis
    plan: starter
    maxmemoryPolicy: allkeys-lru
```

### 2. Deploy via GitHub
1. Push code to GitHub
2. Connect Render to your repository
3. Deploy using the render.yaml blueprint

## Environment Configuration

After deployment, update your frontend .env:

```bash
# Production frontend .env
VITE_SYNC_SERVER_URL=https://sync.islandbitcoin.com
VITE_SYNC_API_KEY=your-very-secure-api-key-here
```

## Security Best Practices

1. **API Key**: Generate a strong API key:
   ```bash
   openssl rand -hex 32
   ```

2. **Firewall**: Configure firewall rules:
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Redis Security**: Secure Redis (if exposed):
   ```bash
   # /etc/redis/redis.conf
   requirepass your-redis-password
   bind 127.0.0.1
   ```

4. **Update CORS**: Edit server.js to include only your production domains:
   ```javascript
   const allowedOrigins = [
     'https://islandbitcoin.com',
     'https://www.islandbitcoin.com',
     'https://community.islandbitcoin.com'
   ];
   ```

## Monitoring

### 1. Health Checks
Monitor the health endpoint:
```bash
curl https://sync.islandbitcoin.com/health
```

### 2. PM2 Monitoring (for VPS deployment)
```bash
pm2 monit
pm2 logs island-bitcoin-sync
```

### 3. Uptime Monitoring
Use services like:
- UptimeRobot
- Pingdom
- Better Uptime

Configure to check: `https://sync.islandbitcoin.com/health`

## Backup and Recovery

### 1. Redis Backup
```bash
# Manual backup
redis-cli BGSAVE

# Automated backup with cron
0 */6 * * * redis-cli BGSAVE
```

### 2. Configuration Backup
The sync server stores configuration in memory and Redis. For production, consider:
- Implementing database persistence (PostgreSQL/MongoDB)
- Regular Redis snapshots
- Configuration exports to S3/backup storage

## Troubleshooting

### Check server logs
```bash
# PM2
pm2 logs island-bitcoin-sync

# Docker
docker logs island-bitcoin-sync

# Systemd
journalctl -u island-bitcoin-sync -f
```

### Test API connectivity
```bash
# Health check
curl https://sync.islandbitcoin.com/health

# Test config API (with auth)
curl -H "X-API-Key: your-api-key" https://sync.islandbitcoin.com/api/config
```

### Common Issues

1. **CORS errors**: Update allowedOrigins in server.js
2. **Connection refused**: Check firewall and nginx configuration
3. **401 Unauthorized**: Verify API_SECRET matches in frontend and backend
4. **Redis connection failed**: Ensure Redis is running and accessible

## Performance Optimization

1. **Enable Redis persistence**:
   ```bash
   # /etc/redis/redis.conf
   appendonly yes
   appendfsync everysec
   ```

2. **Nginx caching** (for static responses):
   ```nginx
   location /health {
       proxy_pass http://localhost:3001;
       proxy_cache_valid 200 1m;
   }
   ```

3. **Node.js clustering** (for high traffic):
   ```javascript
   // Use PM2 cluster mode
   pm2 start server.js -i max
   ```

## Cost Estimates

- **VPS (DigitalOcean/Linode)**: $5-10/month
- **Railway.app**: $5-20/month (usage-based)
- **Fly.io**: $0-10/month (generous free tier)
- **Render.com**: $7-25/month
- **Heroku**: $5-25/month

## Next Steps

1. Deploy the sync server using your preferred method
2. Update frontend environment variables
3. Test configuration synchronization
4. Set up monitoring and backups
5. Consider implementing database persistence for long-term storage

## Support

For issues or questions:
- GitHub Issues: https://github.com/islandbitcoin/www/issues
- Documentation: https://docs.islandbitcoin.com