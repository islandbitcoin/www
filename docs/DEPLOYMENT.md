# Island Bitcoin Deployment Guide

This guide will help you deploy your own Island Bitcoin community site.

## Prerequisites

- Docker and Docker Compose installed
- A domain name
- BTCPay Server instance (for withdrawals)
- Basic knowledge of server administration

## Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/islandbitcoin-web.git
cd islandbitcoin-web/public_html
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
nano .env
```

3. **Update CORS settings**
Edit `server/server.js` and add your domain to the `allowedOrigins` array:
```javascript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];
```

4. **Build and start services**
```bash
docker-compose up -d
```

5. **Verify deployment**
- Frontend: http://yourdomain.com
- Sync Server: http://yourdomain.com:3001/health

## Configuration

### Essential Settings

#### Site Configuration
- `VITE_SITE_NAME`: Your community name
- `VITE_SITE_URL`: Your domain URL
- `VITE_SITE_TAGLINE`: Your community tagline

#### BTCPay Server (for withdrawals)
- `VITE_BTCPAY_SERVER_URL`: Your BTCPay Server URL
- `VITE_BTCPAY_STORE_ID`: Your store ID
- `VITE_BTCPAY_API_KEY`: API key with pull payment permissions

#### Security
- `API_SECRET`: Change this from the default!
- `VITE_SYNC_API_KEY`: Must match `API_SECRET`

### Optional Customization

#### Theme Colors
- `VITE_THEME_COLOR`: Primary color (hex)
- `VITE_ACCENT_COLOR`: Secondary color (hex)

#### Game Rewards (in satoshis)
- `VITE_DEFAULT_TRIVIA_EASY_REWARD`: Default 5
- `VITE_DEFAULT_TRIVIA_MEDIUM_REWARD`: Default 10
- `VITE_DEFAULT_TRIVIA_HARD_REWARD`: Default 21

## Production Deployment

### Using HTTPS (Recommended)

1. **Install Nginx and Certbot**
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

2. **Configure Nginx reverse proxy**
```nginx
server {
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **Get SSL certificate**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Security Checklist

- [ ] Change default API_SECRET
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Monitor server logs
- [ ] Keep Docker images updated
- [ ] Enable rate limiting
- [ ] Configure fail2ban

## Performance Optimization

### Redis Caching

The application includes Redis caching for improved performance:

- **Config caching**: Game configuration is cached for 5 minutes
- **Frontend caching**: Client-side caching with localStorage
- **Automatic cache invalidation**: Cache is cleared on config updates

To monitor Redis:
```bash
# Check Redis connection
docker exec -it islandbitcoin-redis redis-cli ping

# Monitor cache usage
docker exec -it islandbitcoin-redis redis-cli monitor

# View all cached keys
docker exec -it islandbitcoin-redis redis-cli keys "*"
```

## Updating

To update to the latest version:

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Backup

### Backup sync server data
```bash
docker-compose exec sync-server tar -czf /tmp/backup.tar.gz /app/data
docker cp islandbitcoin-sync:/tmp/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz
```

### Restore from backup
```bash
docker cp backup.tar.gz islandbitcoin-sync:/tmp/
docker-compose exec sync-server tar -xzf /tmp/backup.tar.gz -C /
```

## Troubleshooting

### Check logs
```bash
# Frontend logs
docker logs islandbitcoin-frontend

# Sync server logs
docker logs islandbitcoin-sync

# Redis logs
docker logs islandbitcoin-redis
```

### Common Issues

1. **CORS errors**: Make sure your domain is in the allowedOrigins list
2. **API authentication fails**: Verify API_SECRET matches VITE_SYNC_API_KEY
3. **BTCPay connection fails**: Check firewall and BTCPay API permissions
4. **High memory usage**: Adjust Docker memory limits in docker-compose.yml

## Support

For help and support:
- GitHub Issues: https://github.com/yourusername/islandbitcoin-web/issues
- Nostr: #islandbitcoin

## License

This project is open source under the MIT License.