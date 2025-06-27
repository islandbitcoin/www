# Island Bitcoin Deployment Guide

## Quick Deploy (Automated)

The easiest way to deploy is using the automated deployment script:

```bash
./deploy.sh
```

This script will:
- Pull latest changes from git
- Install dependencies
- Build the frontend
- Start/restart the server using PM2
- Run health checks

## Manual Deployment Steps

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/islandbitcoin/www.git
cd www

# Install dependencies
npm install
cd server && npm install && cd ..

# Build frontend
npm run build
```

### 2. Environment Configuration

Create a `.env` file in the server directory:

```bash
cd server
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `PORT` - Server port (default: 3000)
- `API_SECRET` - Secret key for API authentication
- `REDIS_URL` - Redis connection URL (optional)

### 3. Server Management

#### Option A: Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the server
cd server
pm2 start unified-server.js --name island-bitcoin-server

# Save PM2 configuration
pm2 save
pm2 startup  # Follow the instructions to enable auto-start

# Useful PM2 commands
pm2 status              # Check server status
pm2 logs                # View logs
pm2 restart all         # Restart server
pm2 monit               # Real-time monitoring
```

#### Option B: Using systemd

```bash
# Copy service file
sudo cp server/island-bitcoin.service /etc/systemd/system/

# Update paths in service file
sudo nano /etc/systemd/system/island-bitcoin.service

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable island-bitcoin
sudo systemctl start island-bitcoin

# Check status
sudo systemctl status island-bitcoin
sudo journalctl -u island-bitcoin -f
```

### 4. Nginx Configuration

If using Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name community.islandbitcoin.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name community.islandbitcoin.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Remove any rate limiting here
    # limit_req_zone and limit_req directives should be removed

    location / {
        root /var/www/islandbitcoin/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
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

### 5. Troubleshooting

#### Check if correct server is running:
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "serverFile": "unified-server.js",
  "rateLimit": "disabled"
}
```

#### 429 Too Many Requests Error

If you see 429 errors, check:

1. **Nginx rate limiting** - Remove any `limit_req` directives in nginx config
2. **Cloudflare rate limiting** - Check Cloudflare dashboard for rate limit rules
3. **Other reverse proxies** - Check for rate limiting in any other proxies

#### 401 Unauthorized on /api/config

The `/api/config` endpoint should be public. If you get 401:

1. Verify the server is running the latest code:
   ```bash
   curl http://localhost:3000/api/health
   ```
   Check that version is "2.0.0" or higher

2. Check server logs:
   ```bash
   pm2 logs island-bitcoin-server
   # or
   sudo journalctl -u island-bitcoin -f
   ```

3. Ensure no middleware is interfering with the request

## Continuous Deployment

For automated deployments on push:

1. **GitHub Actions** - See `.github/workflows/deploy.yml`
2. **Webhook deployment** - Set up a webhook to trigger `deploy.sh`
3. **Git hooks** - Use post-receive hooks for automatic deployment

## Security Considerations

1. **API Key** - Keep `API_SECRET` secure and rotate regularly
2. **HTTPS** - Always use HTTPS in production
3. **Firewall** - Only expose necessary ports (80, 443)
4. **Updates** - Keep dependencies updated:
   ```bash
   npm audit fix
   npm update
   ```

## Monitoring

1. **Health checks** - Monitor `/api/health` endpoint
2. **Logs** - Set up log rotation and monitoring
3. **Uptime monitoring** - Use services like UptimeRobot
4. **Error tracking** - Consider Sentry or similar