# Docker Quick Start - Unified Deployment

Deploy Island Bitcoin with Docker in one command!

## Prerequisites

- Docker and Docker Compose installed
- Git (to clone the repository)

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/islandbitcoin/www.git
cd www

# Create .env file
echo "API_SECRET=$(openssl rand -hex 32)" > .env
```

### 2. Build and Run

```bash
# Using the unified docker-compose
docker-compose -f docker-compose.unified.yml up -d
```

### 3. Access Your App

- App: http://localhost:3000
- Health: http://localhost:3000/api/health

## What's Included

The unified Docker deployment includes:

1. **Island Bitcoin App** (port 3000)
   - React frontend
   - Sync API server
   - All in one container

2. **Redis** (optional caching)
   - Automatic memory management
   - Persistent storage

3. **Nginx** (optional, port 80/443)
   - SSL termination
   - Static asset caching
   - Security headers

## Commands

### Start
```bash
docker-compose -f docker-compose.unified.yml up -d
```

### Stop
```bash
docker-compose -f docker-compose.unified.yml down
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.unified.yml logs -f

# Just the app
docker-compose -f docker-compose.unified.yml logs -f app
```

### Rebuild After Changes
```bash
docker-compose -f docker-compose.unified.yml up -d --build
```

### Clean Everything
```bash
docker-compose -f docker-compose.unified.yml down -v
```

## Production Deployment

### With SSL (Let's Encrypt)

1. **Update nginx-docker.conf**
   - Uncomment the HTTPS server block
   - Set your domain name

2. **Add SSL certificates**
   ```bash
   mkdir ssl
   # Copy your certificates to ./ssl/cert.pem and ./ssl/key.pem
   ```

3. **Update .env**
   ```bash
   # Add your production settings
   echo "NODE_ENV=production" >> .env
   ```

### Environment Variables

Create a `.env` file with:

```bash
# Required
API_SECRET=your-secure-api-key

# Optional
NODE_ENV=production
PORT=3000
REDIS_URL=redis://redis:6379
```

## Docker Hub Deployment

You can also use our pre-built image:

```bash
docker run -d \
  -p 3000:3000 \
  -e API_SECRET=your-api-key \
  --name island-bitcoin \
  islandbitcoin/app:latest
```

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Or use a different port
PORT=8080 docker-compose -f docker-compose.unified.yml up -d
```

### Redis Connection Errors
Redis is optional. The app works fine without it. To disable:
```bash
# Remove redis dependency from docker-compose.unified.yml
# Or just ignore the errors
```

### Build Fails
```bash
# Clean and rebuild
docker-compose -f docker-compose.unified.yml down -v
docker system prune -a
docker-compose -f docker-compose.unified.yml up -d --build
```

## File Structure

```
.
├── Dockerfile.unified       # Unified app image
├── docker-compose.unified.yml # Complete stack
├── nginx-docker.conf       # Nginx configuration
├── .env                    # Environment variables
└── logs/                   # Application logs
```

## Next Steps

1. Configure your domain
2. Setup SSL certificates
3. Configure monitoring
4. Setup backups

## One-Liner Deploy

For the truly impatient:

```bash
curl -sSL https://raw.githubusercontent.com/islandbitcoin/www/main/deploy-docker.sh | bash
```

This will:
- Clone the repository
- Generate secure API key
- Build and start everything
- Show you the access URL