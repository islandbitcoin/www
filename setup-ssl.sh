#!/bin/bash

# Island Bitcoin - SSL Setup Script
# This script configures Nginx and SSL certificates for your deployment

set -e

echo "🔒 Island Bitcoin - SSL Setup"
echo "=============================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run this script with sudo: sudo ./setup-ssl.sh"
    exit 1
fi

# Load domain from .env
if [ -f .env ]; then
    DOMAIN=$(grep "^DOMAIN=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    EMAIL=$(grep "^EMAIL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
else
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Check required variables
if [ -z "$DOMAIN" ]; then
    echo "❌ Error: DOMAIN not set in .env file!"
    exit 1
fi

if [ -z "$EMAIL" ]; then
    echo "⚠️  Warning: EMAIL not set in .env file!"
    read -p "Enter email for SSL certificates: " EMAIL
fi

echo "📋 Configuration:"
echo "   Domain: $DOMAIN"
echo "   Email: $EMAIL"
echo ""
read -p "Is this correct? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "❌ Setup cancelled"
    exit 1
fi

# Install Nginx and Certbot if not already installed
echo "📦 Installing Nginx and Certbot..."
apt update
apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
echo "📝 Creating Nginx configuration..."
cat > /etc/nginx/sites-available/island-bitcoin << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API specific settings
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # API timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
EOF

# Enable the site
echo "🔗 Enabling Nginx site..."
ln -sf /etc/nginx/sites-available/island-bitcoin /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# Reload Nginx
echo "🔄 Reloading Nginx..."
systemctl reload nginx

# Check if Island Bitcoin is running
echo "🏝️ Checking if Island Bitcoin is running..."
if ! docker compose ps | grep -q "Up"; then
    echo "⚠️  Island Bitcoin doesn't appear to be running."
    echo "   Run './deploy-digitalocean.sh' first to start the application."
    read -p "Continue with SSL setup anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
fi

# Get SSL certificate
echo ""
echo "🔒 Getting SSL certificate from Let's Encrypt..."
echo "   This will modify your Nginx configuration automatically."
echo ""

certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --no-eff-email

# Set up auto-renewal
echo ""
echo "⏰ Setting up automatic SSL renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Create renewal test script
cat > /home/island/test-ssl-renewal.sh << 'EOF'
#!/bin/bash
echo "Testing SSL certificate renewal..."
sudo certbot renew --dry-run
EOF
chmod +x /home/island/test-ssl-renewal.sh

echo ""
echo "✅ SSL Setup Complete!"
echo ""
echo "🌐 Your site is now available at:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "🔒 SSL certificate will auto-renew before expiration."
echo ""
echo "📊 To check certificate status:"
echo "   sudo certbot certificates"
echo ""
echo "🧪 To test renewal:"
echo "   sudo certbot renew --dry-run"
echo ""
echo "📝 Nginx configuration saved at:"
echo "   /etc/nginx/sites-available/island-bitcoin"