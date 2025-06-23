#!/bin/bash

# Island Bitcoin - Setup alongside Lightning-Server
# This script helps configure Island Bitcoin to run with Lightning-Server

set -e

echo "🏝️ Island Bitcoin + Lightning-Server Setup"
echo "=========================================="
echo ""

# Check current ports in use
echo "📊 Checking current port usage..."
echo "Ports currently in use:"
sudo lsof -i -P -n | grep LISTEN | grep -E ":(3000|3001|3002|8080|10009)" || echo "No conflicts detected"
echo ""

# Ask user about Lightning-Server setup
echo "❓ How is Lightning-Server currently running?"
echo "1) PM2 (process manager)"
echo "2) Docker container"
echo "3) Systemd service"
echo "4) Direct Node.js process"
read -p "Select option (1-4): " LS_SETUP

# Determine Lightning-Server port
read -p "What port is Lightning-Server using? (default: 3001): " LS_PORT
LS_PORT=${LS_PORT:-3001}

# Determine Island Bitcoin port
if [ "$LS_PORT" == "3000" ]; then
    IB_PORT=3002
    echo "⚠️  Lightning-Server is using port 3000, Island Bitcoin will use port 3002"
else
    IB_PORT=3000
    echo "✅ Island Bitcoin will use port 3000"
fi

# Domain configuration
echo ""
echo "🌐 Domain Configuration"
read -p "Enter your main domain (e.g., example.com): " MAIN_DOMAIN
read -p "Use subdomain for Lightning-Server? (y/n): " USE_SUBDOMAIN

if [ "$USE_SUBDOMAIN" == "y" ]; then
    read -p "Enter subdomain for Lightning-Server (default: lightning): " LS_SUBDOMAIN
    LS_SUBDOMAIN=${LS_SUBDOMAIN:-lightning}
    LS_DOMAIN="${LS_SUBDOMAIN}.${MAIN_DOMAIN}"
else
    LS_DOMAIN=$MAIN_DOMAIN
    echo "⚠️  You'll need to use path-based routing (e.g., /lightning)"
fi

# Create Nginx configuration
echo ""
echo "📝 Creating Nginx configuration..."
cat > /tmp/island-bitcoin-nginx.conf << EOF
# Island Bitcoin - Main domain
server {
    listen 80;
    server_name ${MAIN_DOMAIN} www.${MAIN_DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${MAIN_DOMAIN} www.${MAIN_DOMAIN};

    # SSL will be configured by certbot
    # ssl_certificate /etc/letsencrypt/live/${MAIN_DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${MAIN_DOMAIN}/privkey.pem;

    location / {
        proxy_pass http://localhost:${IB_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

if [ "$USE_SUBDOMAIN" == "y" ]; then
    cat >> /tmp/island-bitcoin-nginx.conf << EOF

# Lightning Server - Subdomain
server {
    listen 80;
    server_name ${LS_DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${LS_DOMAIN};

    # SSL will be configured by certbot
    # ssl_certificate /etc/letsencrypt/live/${LS_DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${LS_DOMAIN}/privkey.pem;

    location / {
        proxy_pass http://localhost:${LS_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
fi

# Update docker-compose if needed
if [ "$IB_PORT" != "3000" ]; then
    echo ""
    echo "📝 Updating docker-compose.yml for port ${IB_PORT}..."
    sed -i "s/\"3000:3000\"/\"${IB_PORT}:3000\"/" docker-compose.yml
fi

echo ""
echo "✅ Configuration prepared!"
echo ""
echo "Next steps:"
echo "1. Copy Nginx config:"
echo "   sudo cp /tmp/island-bitcoin-nginx.conf /etc/nginx/sites-available/island-bitcoin"
echo "   sudo ln -s /etc/nginx/sites-available/island-bitcoin /etc/nginx/sites-enabled/"
echo ""
echo "2. Test and reload Nginx:"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""
echo "3. Get SSL certificates:"
echo "   sudo certbot --nginx -d ${MAIN_DOMAIN} -d www.${MAIN_DOMAIN}"
if [ "$USE_SUBDOMAIN" == "y" ]; then
    echo "   sudo certbot --nginx -d ${LS_DOMAIN}"
fi
echo ""
echo "4. Configure Island Bitcoin .env file"
echo "5. Deploy with: docker compose up -d"
echo ""
echo "📋 Summary:"
echo "   Island Bitcoin: ${MAIN_DOMAIN} (port ${IB_PORT})"
echo "   Lightning Server: ${LS_DOMAIN} (port ${LS_PORT})"