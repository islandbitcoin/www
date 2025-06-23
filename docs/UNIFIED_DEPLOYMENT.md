# Unified Deployment Guide

Deploy Island Bitcoin as a single application serving both frontend and API.

## Overview

Instead of running separate servers for the frontend and sync API, this unified approach:
- Serves the React app and API from one Node.js server
- Simplifies deployment and maintenance
- Reduces infrastructure costs
- Eliminates CORS configuration issues
- Uses the same domain for everything

## Architecture

```
┌─────────────────┐
│   Nginx (443)   │ ← SSL termination
└────────┬────────┘
         │
┌────────▼────────┐
│ Node.js (3000)  │
├─────────────────┤
│  /api/* → API   │ ← Sync endpoints
│  /*     → SPA   │ ← React frontend
└─────────────────┘
         │
┌────────▼────────┐
│     Redis       │ ← Optional caching
└─────────────────┘
```

## Quick Start

### 1. One-Command Deploy

```bash
# From project root
./deploy-unified.sh
```

This script will:
1. Build the frontend
2. Setup the server
3. Guide you through deployment options

### 2. Manual Deploy

```bash
# Build frontend
npm install
npm run build

# Setup server
cd server
npm install
cd ..

# Start unified server
node server/unified-server.js
```

## Production Deployment Options

### Option 1: VPS with PM2 (Recommended)

Perfect for DigitalOcean, Linode, AWS EC2, etc.

```bash
# 1. SSH to your server
ssh user@your-server.com

# 2. Clone repository
git clone https://github.com/islandbitcoin/www.git
cd www

# 3. Run deployment script
./deploy-unified.sh
# Select option 1 (PM2)

# 4. Setup Nginx
sudo cp nginx-island-bitcoin.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/nginx-island-bitcoin.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 5. Setup SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Option 2: Docker Deployment

```bash
# Using docker-compose (created by deploy script)
docker-compose up -d

# Or build manually
docker build -t island-bitcoin .
docker run -d -p 3000:3000 --env-file .env island-bitcoin
```

### Option 3: Platform Deployments

#### Railway.app
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway add redis  # Optional
railway up
```

#### Fly.io
```toml
# fly.toml
app = "island-bitcoin"
primary_region = "mia"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[services]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 443
    handlers = ["http", "tls"]
```

```bash
fly launch
fly secrets set API_SECRET=your-secret-key
fly deploy
```

#### Render.com
1. Connect GitHub repository
2. Use the Dockerfile created by deploy script
3. Set environment variables in dashboard

## Environment Configuration

### Frontend (.env)
```bash
# For unified deployment, leave empty or use relative path
VITE_SYNC_SERVER_URL=
VITE_SYNC_API_KEY=your-generated-api-key

# Other settings
VITE_SITE_NAME="Island Bitcoin"
VITE_DEFAULT_RELAY="wss://relay.primal.net"
```

### Server (.env)
```bash
# Must match VITE_SYNC_API_KEY
API_SECRET=your-generated-api-key
PORT=3000
NODE_ENV=production

# Optional Redis
REDIS_URL=redis://localhost:6379
```

## API Endpoints

All API endpoints are now under `/api/*`:

- `GET /api/health` - Health check
- `GET /api/config` - Get configuration (requires auth)
- `POST /api/config` - Update configuration (requires auth)
- `DELETE /api/config` - Remove configuration (requires auth)

## Frontend Routes

All other routes serve the React SPA:
- `/` - Homepage
- `/about` - About page
- `/admin` - Admin panel
- etc.

## Benefits of Unified Deployment

1. **Simplified Infrastructure**
   - One server to manage
   - One domain/SSL certificate
   - One deployment process

2. **Better Performance**
   - No cross-origin requests
   - Shared resources
   - Simplified caching

3. **Easier Development**
   - No CORS issues
   - Simpler environment config
   - Single log stream

4. **Cost Effective**
   - One server instead of two
   - Reduced bandwidth
   - Simpler monitoring

## Monitoring

### Health Check
```bash
curl https://yourdomain.com/api/health
```

### PM2 Monitoring
```bash
pm2 monit
pm2 logs island-bitcoin
```

### Docker Logs
```bash
docker-compose logs -f
```

## Updating

### With PM2
```bash
git pull
npm install
npm run build
cd server && npm install && cd ..
pm2 restart island-bitcoin
```

### With Docker
```bash
git pull
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Kill it if needed
kill -9 <PID>
```

### Build Fails
```bash
# Clear caches
rm -rf node_modules dist
npm install
npm run build
```

### API Returns 404
- Check that server is running
- Verify `/api/*` routes exist
- Check nginx proxy configuration

### Frontend Shows Blank Page
- Check browser console for errors
- Verify dist folder exists
- Check that index.html is served

## Security Considerations

1. **API Key**: Generate secure key with:
   ```bash
   openssl rand -hex 32
   ```

2. **Firewall**: Only expose necessary ports:
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

3. **Updates**: Keep dependencies updated:
   ```bash
   npm audit fix
   npm update
   ```

## Migration from Separate Deployment

If you're currently running separate frontend and sync server:

1. **Update Frontend Config**
   ```bash
   # Change from absolute URL
   VITE_SYNC_SERVER_URL=https://sync.domain.com
   
   # To relative or empty
   VITE_SYNC_SERVER_URL=
   ```

2. **Stop Old Services**
   ```bash
   pm2 stop sync-server
   pm2 delete sync-server
   ```

3. **Deploy Unified**
   ```bash
   ./deploy-unified.sh
   ```

## Performance Tips

1. **Enable Compression**
   ```javascript
   // Add to unified-server.js
   import compression from 'compression';
   app.use(compression());
   ```

2. **Static Asset Caching**
   - Already configured in nginx config
   - Assets cached for 1 year

3. **Redis Caching**
   - Enabled by default if Redis available
   - 5-minute TTL for config

## Conclusion

The unified deployment simplifies your infrastructure while maintaining all functionality. It's easier to deploy, manage, and scale.

For questions or issues:
- GitHub: https://github.com/islandbitcoin/www/issues
- Documentation: https://docs.islandbitcoin.com