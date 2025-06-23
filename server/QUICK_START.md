# Quick Start: Deploy Sync Server in 5 Minutes

## Option 1: Deploy on Railway (Easiest)

1. **Click Deploy Button**
   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/islandbitcoin/www&envs=API_SECRET&optionalEnvs=REDIS_URL)

2. **Set Environment Variables**
   - `API_SECRET`: Generate with `openssl rand -hex 32`

3. **Get Your URL**
   - Railway will provide: `https://your-app.railway.app`

4. **Update Frontend**
   ```bash
   VITE_SYNC_SERVER_URL=https://your-app.railway.app
   VITE_SYNC_API_KEY=your-api-secret
   ```

## Option 2: Deploy on VPS (Most Control)

```bash
# 1. SSH to your server
ssh user@your-server.com

# 2. Clone and setup
git clone https://github.com/islandbitcoin/www.git
cd www/server

# 3. Run deployment script
./deploy.sh

# 4. Follow the prompts
# The script will:
# - Install dependencies
# - Generate secure API key
# - Setup PM2/systemd
# - Create Nginx config
```

## Option 3: Deploy with Docker (One Command)

```bash
# 1. Create .env file
echo "API_SECRET=$(openssl rand -hex 32)" > .env

# 2. Run with docker-compose
docker-compose up -d

# 3. Done! Server running on port 3001
```

## Testing Your Deployment

```bash
# Health check
curl https://your-sync-server.com/health

# Test API (with your API key)
curl -H "X-API-Key: your-api-key" https://your-sync-server.com/api/config
```

## Frontend Configuration

Update your production `.env`:

```bash
# Sync server URL (no trailing slash)
VITE_SYNC_SERVER_URL=https://sync.islandbitcoin.com

# API key (must match server)
VITE_SYNC_API_KEY=your-api-key-here
```

## Common Issues

### CORS Error
Add your domain to `allowedOrigins` in `server.js`:
```javascript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];
```

### 401 Unauthorized
Check that `VITE_SYNC_API_KEY` matches `API_SECRET` on server.

### Connection Refused
- Check firewall allows port 3001
- Verify Nginx is proxying correctly
- Ensure server is running: `pm2 status`

## Next Steps

1. ✅ Server deployed
2. ✅ Frontend configured
3. 📊 Monitor health endpoint
4. 🔒 Setup SSL certificate
5. 📈 Add monitoring (UptimeRobot)