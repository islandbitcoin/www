# CDN Deployment Guide

This guide explains how to deploy Island Bitcoin with CDN support for improved performance and global distribution.

## Overview

CDN (Content Delivery Network) deployment improves performance by:
- Serving static assets from edge locations near users
- Reducing server load for static content
- Improving page load times globally
- Better handling of traffic spikes

## Supported CDN Providers

### 1. Cloudflare (Recommended)

**Free tier includes:**
- Unlimited bandwidth
- Global CDN
- DDoS protection
- SSL/TLS encryption

**Setup:**

1. **Sign up for Cloudflare**
   - Create account at [cloudflare.com](https://cloudflare.com)
   - Add your domain

2. **Configure DNS**
   - Point your domain to Cloudflare nameservers
   - Add A record pointing to your server IP

3. **Configure Page Rules**
   ```
   Pattern: yourdomain.com/assets/*
   Settings: 
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   ```

4. **Update environment variables**
   ```bash
   VITE_USE_CDN=true
   VITE_CDN_URL=https://yourdomain.com
   ```

### 2. AWS CloudFront

**Setup:**

1. **Create S3 bucket** for static assets
   ```bash
   aws s3 mb s3://islandbitcoin-assets
   ```

2. **Create CloudFront distribution**
   - Origin: Your S3 bucket
   - Behaviors: Cache based on file extension
   - Compress: Yes

3. **Update build script**
   ```bash
   # Build with CDN config
   npm run build:cdn
   
   # Sync assets to S3
   aws s3 sync dist/assets s3://islandbitcoin-assets/assets --cache-control "public, max-age=31536000"
   ```

4. **Update environment variables**
   ```bash
   VITE_USE_CDN=true
   VITE_CDN_URL=https://d1234567890.cloudfront.net
   ```

### 3. Bunny CDN (Budget-friendly)

**Setup:**

1. **Create Pull Zone**
   - Origin URL: https://yourdomain.com
   - Zone name: islandbitcoin

2. **Configure caching**
   - Cache Expiration: 30 days for assets
   - Query String: Ignore for assets

3. **Update environment variables**
   ```bash
   VITE_USE_CDN=true
   VITE_CDN_URL=https://islandbitcoin.b-cdn.net
   ```

## Build Configuration

### Standard Build (No CDN)
```bash
npm run build
```

### CDN Build
```bash
# Set environment variables
export VITE_USE_CDN=true
export VITE_CDN_URL=https://cdn.yourdomain.com

# Build with CDN configuration
npm run build -- --config vite.config.cdn.ts
```

## Nginx Configuration for CDN

Update your nginx.conf to handle CDN deployments:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /usr/share/nginx/html;

    # Long cache for assets when using CDN
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # CORS headers for CDN
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
    }

    # Short cache for HTML
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # API routes should not be cached
    location /api {
        proxy_pass http://sync-server:3001;
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
    }
}
```

## Docker Configuration for CDN

Update docker-compose.yml for CDN builds:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      args:
        - VITE_USE_CDN=${VITE_USE_CDN:-false}
        - VITE_CDN_URL=${VITE_CDN_URL:-}
    environment:
      - NODE_ENV=production
    # ... rest of config
```

Update Dockerfile:

```dockerfile
FROM node:20-alpine as builder

WORKDIR /app

# Build args for CDN
ARG VITE_USE_CDN=false
ARG VITE_CDN_URL=""

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build with CDN config if enabled
RUN if [ "$VITE_USE_CDN" = "true" ]; then \
      npm run build -- --config vite.config.cdn.ts; \
    else \
      npm run build; \
    fi

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Performance Optimization

### 1. Asset Optimization

```bash
# Install image optimization tools
npm install --save-dev imagemin imagemin-pngquant imagemin-mozjpeg

# Add to package.json scripts
"optimize-images": "imagemin public/images/* --out-dir=public/images"
```

### 2. Preload Critical Assets

Update index.html:
```html
<!-- Preload critical fonts -->
<link rel="preload" href="/assets/fonts/outfit-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>

<!-- Preload critical CSS -->
<link rel="preload" href="/assets/index-[hash].css" as="style">

<!-- DNS prefetch for CDN -->
<link rel="dns-prefetch" href="https://cdn.yourdomain.com">
```

### 3. Service Worker for Offline Support

Create `public/sw.js`:
```javascript
const CACHE_NAME = 'island-bitcoin-v1';
const CDN_URL = 'https://cdn.yourdomain.com';

// Cache CDN assets
self.addEventListener('fetch', (event) => {
  if (event.request.url.startsWith(CDN_URL)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          return response || fetch(event.request).then((response) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});
```

## Monitoring CDN Performance

### 1. CloudFlare Analytics
- Cache hit ratio
- Bandwidth saved
- Request analytics

### 2. Custom Monitoring

Add to your app:
```typescript
// Track CDN performance
if (window.performance && window.performance.getEntriesByType) {
  const resources = window.performance.getEntriesByType('resource');
  const cdnResources = resources.filter(r => r.name.includes('cdn.'));
  
  console.log('CDN Performance:', {
    totalResources: cdnResources.length,
    avgLoadTime: cdnResources.reduce((sum, r) => sum + r.duration, 0) / cdnResources.length,
    totalSize: cdnResources.reduce((sum, r) => sum + r.transferSize, 0)
  });
}
```

## Cost Optimization

### 1. Cloudflare (Free)
- No bandwidth costs
- Free SSL
- Basic analytics

### 2. AWS CloudFront
- ~$0.085/GB for first 10TB
- ~$0.0075-$0.02 per 10,000 requests
- Use S3 lifecycle policies to reduce storage costs

### 3. Bunny CDN
- ~$0.01-$0.06/GB depending on region
- Minimum $1/month

## Deployment Checklist

- [ ] Choose CDN provider
- [ ] Configure DNS/CDN settings
- [ ] Update environment variables
- [ ] Build with CDN configuration
- [ ] Deploy static assets to CDN
- [ ] Update nginx configuration
- [ ] Test CDN endpoints
- [ ] Monitor cache hit rates
- [ ] Set up alerting for CDN issues

## Rollback Plan

If CDN deployment causes issues:

1. **Quick rollback**
   ```bash
   # Disable CDN
   export VITE_USE_CDN=false
   
   # Rebuild without CDN
   npm run build
   
   # Deploy immediately
   docker-compose up -d
   ```

2. **DNS rollback** (if using Cloudflare)
   - Set to "DNS only" mode
   - Disable proxy/CDN features

3. **Clear CDN cache**
   - Purge all cached assets
   - Wait for propagation

## Best Practices

1. **Version your assets** - Use content hashes in filenames
2. **Set proper cache headers** - Long TTL for assets, short for HTML
3. **Monitor cache hit rates** - Aim for >90% hit rate
4. **Use compression** - Enable gzip/brotli at CDN level
5. **Implement fallbacks** - Handle CDN failures gracefully
6. **Test globally** - Use tools like GTmetrix from different locations
7. **Budget alerts** - Set up cost alerts for CDN usage