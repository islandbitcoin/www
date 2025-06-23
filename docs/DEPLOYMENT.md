# Island Bitcoin - DigitalOcean Deployment Guide

This guide covers deploying Island Bitcoin on DigitalOcean using Docker and the unified architecture.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [DigitalOcean Setup](#digitalocean-setup)
3. [Environment Configuration](#environment-configuration)
4. [Docker Deployment](#docker-deployment)
5. [SSL Configuration](#ssl-configuration)
6. [Monitoring](#monitoring)
7. [Backup Strategy](#backup-strategy)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- DigitalOcean account
- Domain name with DNS access
- SSH key pair for server access
- BTCPay Server instance (optional, for Lightning payments)

## DigitalOcean Setup

### 1. Create a Droplet

1. Log into DigitalOcean and click "Create Droplet"
2. Choose Ubuntu 22.04 LTS
3. Select droplet size:
   - **Basic**: $20/month (2GB RAM, 1 CPU) - for < 1000 users
   - **General Purpose**: $40/month (4GB RAM, 2 CPU) - for 1000-5000 users
   - **CPU-Optimized**: $80/month (4GB RAM, 2 CPU) - for 5000+ users
4. Choose datacenter region closest to your users
5. Add your SSH key
6. Enable backups (recommended)
7. Set hostname: `island-bitcoin`

### 2. Initial Server Setup

SSH into your droplet:

```bash
ssh root@your-droplet-ip
```

Run initial setup:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Create app user
useradd -m -s /bin/bash island
usermod -aG docker island

# Setup firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## Environment Configuration

### Required Variables

Create `.env` file in the project root:

```env
# API Configuration
API_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32
PORT=3000
NODE_ENV=production

# Redis Configuration
REDIS_URL=redis://redis:6379

# Domain Configuration
DOMAIN=yourdomain.com  # Your domain name
EMAIL=admin@yourdomain.com  # For SSL certificates
```

### Optional Variables

```env
# BTCPay Server (if using Lightning payments)
BTCPAY_SERVER_URL=https://your-btcpay.com
BTCPAY_STORE_ID=your-store-id
BTCPAY_API_KEY=your-api-key
```

## Docker Deployment

### 1. Clone and Setup

On your DigitalOcean droplet:

```bash
# Switch to app user
su - island

# Clone repository
git clone https://github.com/yourusername/islandbitcoin-web.git
cd islandbitcoin-web/public_html

# Create environment file
nano .env
# Add your environment variables from above
```

### 2. Deploy Application

```bash
# Pull latest changes
git pull origin main

# Build and start services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f app
```

### 3. Update Deployment

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose down
docker compose up -d --build

# Remove old images
docker image prune -f
```

### Docker Management

```bash
# View logs
docker compose logs -f [service-name]

# Restart service
docker compose restart app

# Enter container
docker compose exec app sh

# Check resource usage
docker stats
```

## SSL Configuration

### Using Nginx with Let's Encrypt

1. **Point Domain to Droplet**:
   ```bash
   # Add A record in your DNS:
   # Type: A
   # Name: @ (or subdomain)
   # Value: your-droplet-ip
   ```

2. **Install Certbot**:
   ```bash
   # On the droplet as root
   apt install certbot python3-certbot-nginx -y
   ```

3. **Configure Nginx**:
   ```bash
   # Create nginx config
   nano /etc/nginx/sites-available/island-bitcoin
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       location / {
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

4. **Enable Site and Get Certificate**:
   ```bash
   # Enable site
   ln -s /etc/nginx/sites-available/island-bitcoin /etc/nginx/sites-enabled/
   rm /etc/nginx/sites-enabled/default
   
   # Test nginx config
   nginx -t
   
   # Reload nginx
   systemctl reload nginx
   
   # Get SSL certificate
   certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

### Using Docker Compose with Nginx

The docker-compose.yml includes an optional nginx service. To use it:

1. **Create SSL certificates directory**:
   ```bash
   mkdir -p ssl
   ```

2. **Update docker-compose.yml** to uncomment the nginx service

3. **Get certificates**:
   ```bash
   # Use certbot in standalone mode
   certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   
   # Copy certificates
   cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
   cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
   ```

## Monitoring

### 1. Resource Monitoring

```bash
# Check Docker container stats
docker stats

# Monitor system resources
htop

# Check disk usage
df -h

# Monitor logs in real-time
docker compose logs -f --tail=100
```

### 2. Application Health

```bash
# Check application health
curl http://localhost:3000/api/health

# Check Redis connection
docker compose exec redis redis-cli ping

# Monitor Redis cache
docker compose exec redis redis-cli monitor
```

### 3. Setup Monitoring Stack (Optional)

Create `monitoring-compose.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=your-grafana-password
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  prometheus-data:
  grafana-data:
```

## Backup Strategy

### 1. Automated Backups

Create backup script `/home/island/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/island/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup Redis data
docker compose exec -T redis redis-cli BGSAVE
sleep 5
docker compose cp redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup application data
tar -czf $BACKUP_DIR/app_data_$DATE.tar.gz /home/island/islandbitcoin-web

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make it executable and add to cron:

```bash
chmod +x /home/island/backup.sh

# Add to crontab (runs daily at 3 AM)
crontab -e
# Add line: 0 3 * * * /home/island/backup.sh >> /home/island/backup.log 2>&1
```

### 2. DigitalOcean Backups

Enable automated backups in your droplet settings for system-level backups.

### 3. Restore Procedure

```bash
# Restore Redis data
docker compose down
docker compose cp /path/to/backup.rdb redis:/data/dump.rdb
docker compose up -d

# Restore application data
tar -xzf /path/to/app_data_backup.tar.gz -C /
```

## Troubleshooting

### Common Issues

1. **Container won't start**:
   ```bash
   # Check logs
   docker compose logs app
   
   # Check if port is in use
   lsof -i :3000
   ```

2. **Redis connection errors**:
   ```bash
   # Test Redis connection
   docker compose exec redis redis-cli ping
   
   # Check Redis logs
   docker compose logs redis
   ```

3. **SSL certificate issues**:
   ```bash
   # Renew certificate
   certbot renew --dry-run  # Test first
   certbot renew
   
   # Check certificate status
   certbot certificates
   ```

4. **High memory usage**:
   ```bash
   # Check memory usage
   free -h
   
   # Limit container memory in docker-compose.yml
   # Add under app service:
   deploy:
     resources:
       limits:
         memory: 2G
   ```

5. **Application errors**:
   ```bash
   # Check application logs
   docker compose logs -f app --tail=200
   
   # Access container shell for debugging
   docker compose exec app sh
   ```

### Useful Commands

```bash
# Restart everything
docker compose restart

# Stop and remove all containers
docker compose down

# Rebuild without cache
docker compose build --no-cache

# Remove unused Docker resources
docker system prune -a

# Check Docker disk usage
docker system df
```

## Performance Optimization

1. **Enable swap (for smaller droplets)**:
   ```bash
   fallocate -l 2G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   echo '/swapfile none swap sw 0 0' >> /etc/fstab
   ```

2. **Configure Redis memory limits**:
   Already configured in docker-compose.yml with maxmemory policy

3. **Enable gzip compression** in Nginx (automatically done by certbot)

## Support

For deployment issues:
- Check logs first: `docker compose logs -f`
- GitHub Issues: [Your repository issues page]
- Community support: [Your community channels]

---

Remember to:
- Keep your server updated: `apt update && apt upgrade`
- Monitor your logs regularly
- Set up alerts for downtime
- Document any custom changes you make