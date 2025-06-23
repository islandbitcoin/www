#!/bin/bash

# Island Bitcoin - DigitalOcean Initial Setup Script
# Run this on a fresh Ubuntu 22.04 droplet

set -e

echo "🏝️ Island Bitcoin - DigitalOcean Setup"
echo "======================================"
echo ""

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker already installed"
fi

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
apt install docker-compose-plugin -y

# Install other useful tools
echo "🛠️ Installing additional tools..."
apt install -y git htop wget curl nano ufw certbot python3-certbot-nginx

# Create app user
echo "👤 Creating app user..."
if ! id -u island &>/dev/null; then
    useradd -m -s /bin/bash island
    usermod -aG docker island
    echo "User 'island' created"
else
    echo "User 'island' already exists"
fi

# Setup firewall
echo "🔒 Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create swap file (useful for smaller droplets)
echo "💾 Creating swap file..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "2GB swap file created"
else
    echo "Swap file already exists"
fi

# Setup directory
echo "📁 Setting up application directory..."
mkdir -p /home/island/islandbitcoin-web
chown -R island:island /home/island/islandbitcoin-web

echo ""
echo "✅ Initial setup complete!"
echo ""
echo "Next steps:"
echo "1. Switch to app user: su - island"
echo "2. Clone your repository:"
echo "   git clone https://github.com/yourusername/islandbitcoin-web.git"
echo "   cd islandbitcoin-web/public_html"
echo "3. Create and configure .env file:"
echo "   cp .env.example .env"
echo "   nano .env"
echo "4. Deploy the application:"
echo "   ./deploy-digitalocean.sh"
echo ""
echo "📚 See DEPLOYMENT.md for detailed instructions"