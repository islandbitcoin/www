# 🚀 Island Bitcoin Deployment Guide

Deploy your own Bitcoin community site in minutes! This guide covers multiple deployment options with one-click scripts.

## 🎯 Quick Start

### Option 1: Automatic Deployment (Recommended)

**For macOS/Linux:**
```bash
./deploy.sh
```

**For Windows:**
```cmd
deploy.bat
```

The script will:
1. Ask if you want to customize your site
2. Install dependencies
3. Build the project
4. Deploy to your chosen platform

### Option 2: Manual Deployment

1. **Clone and customize:**
```bash
git clone https://github.com/yourusername/island-bitcoin
cd island-bitcoin
cp .env.example .env
# Edit .env with your community details
```

2. **Install and build:**
```bash
npm install
npm run build
```

3. **Deploy the `dist` folder to any static hosting service**

## 🌐 Deployment Platforms

### Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/island-bitcoin)

**Manual deployment:**
```bash
npm i -g vercel
vercel --prod
```

**Features:**
- Automatic HTTPS
- Global CDN
- Easy custom domains
- GitHub integration

### Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/island-bitcoin)

**Manual deployment:**
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

**Features:**
- Drag-and-drop deployment
- Form handling
- Split testing
- Identity service

### GitHub Pages

1. **Enable GitHub Pages in repository settings**
2. **Run deployment script:**
```bash
./deploy.sh
# Select option 3 for GitHub Pages
```

3. **Access your site at:**
- `https://[username].github.io/[repository]/`
- Or your custom domain

### Docker

**Build and run:**
```bash
docker build -t island-bitcoin .
docker run -p 8080:80 island-bitcoin
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:80"
    environment:
      - VITE_SITE_NAME=My Bitcoin Community
```

### Self-Hosted VPS

1. **Build locally:**
```bash
npm run build
```

2. **Upload to your server:**
```bash
scp -r dist/* user@server:/var/www/html/
```

3. **Nginx configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    gzip on;
    gzip_types text/plain text/css application/javascript;
}
```

## 🎨 Customization

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Site Identity
VITE_SITE_NAME="Your Bitcoin Community"
VITE_SITE_TAGLINE="Your Tagline Here"
VITE_SITE_DESCRIPTION="Description of your community"
VITE_SITE_URL="https://yourcommunity.com"

# Theme
VITE_THEME_COLOR="#FF6B35"
VITE_ACCENT_COLOR="#00A5CF"

# Community
VITE_COMMUNITY_LOCATION="Your Location"
VITE_COMMUNITY_CURRENCY="USD"
VITE_COMMUNITY_LANGUAGE="en"
VITE_COMMUNITY_TIMEZONE="America/New_York"

# Nostr
VITE_NOSTR_DOMAINS="yourdomain.com,partner.com"
VITE_NOSTR_TAGS="yourcommunity,bitcoin,location"
```

### Regional Examples

**🌍 Africa:**
```env
VITE_SITE_NAME="Bitcoin Safari"
VITE_COMMUNITY_LOCATION="Africa"
VITE_THEME_COLOR="#D2691E"
```

**🌏 Asia:**
```env
VITE_SITE_NAME="Bitcoin Asia"
VITE_COMMUNITY_LOCATION="Asia"
VITE_THEME_COLOR="#DC143C"
```

**🌎 Latin America:**
```env
VITE_SITE_NAME="Bitcoin Latino"
VITE_COMMUNITY_LOCATION="Latin America"
VITE_THEME_COLOR="#FFC107"
```

## 🔧 Advanced Configuration

### Custom Domain Setup

1. **Add your domain to deployment platform**
2. **Update DNS records:**
   - A record: Points to platform IP
   - CNAME: Points to platform subdomain

3. **Enable HTTPS** (usually automatic)

### Relay Configuration

Edit `src/config/site.config.ts`:

```typescript
nostr: {
  defaultRelays: [
    'wss://your-relay.com',
    'wss://backup-relay.com',
  ],
  communityDomains: ['yourdomain.com'],
}
```

### Feature Flags

Toggle features in `site.config.ts`:

```typescript
features: {
  events: true,
  mediaGallery: true,
  bitcoinPrice: true,
  leaderboard: false,
  achievements: false,
}
```

## 📱 PWA Configuration

The site works offline by default! To customize:

1. **Update `manifest.webmanifest`:**
```json
{
  "name": "Your Community",
  "short_name": "YourBTC",
  "theme_color": "#YOUR_COLOR"
}
```

2. **Add app icons** in `/public`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deployment Issues
- Check Node.js version (v18+ required)
- Ensure all environment variables are set
- Verify build output in `dist` folder

### Custom Domain Not Working
1. Check DNS propagation (24-48 hours)
2. Verify SSL certificate
3. Clear browser cache

## 🤝 Community Support

- **Discord**: [Join our server](https://discord.gg/islandbitcoin)
- **Telegram**: [@islandbitcoin](https://t.me/islandbitcoin)
- **Nostr**: Follow us at islandbitcoin@islandbitcoin.com

## 📄 License

MIT License - Fork and customize freely!

---

Built with ❤️ and ⚡ by the Island Bitcoin community