#!/bin/bash

# Island Bitcoin Sync Server Deployment Script
# This script helps deploy the sync server to production

set -e

echo "🚀 Island Bitcoin Sync Server Deployment"
echo "========================================"

# Check if we're in the server directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: Please run this script from the server directory"
    exit 1
fi

# Function to generate secure API key
generate_api_key() {
    openssl rand -hex 32
}

# Function to check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed"
        echo "   Install with: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed"
        exit 1
    fi
    
    echo "✅ Prerequisites satisfied"
}

# Function to setup environment
setup_environment() {
    echo ""
    echo "🔧 Setting up environment..."
    
    if [ ! -f ".env" ]; then
        echo "Creating .env file..."
        
        # Generate API key
        API_KEY=$(generate_api_key)
        
        cat > .env << EOF
# Island Bitcoin Sync Server Configuration
NODE_ENV=production
PORT=3001
API_SECRET=$API_KEY

# Redis Configuration (optional)
# REDIS_URL=redis://localhost:6379

# CORS Origins (update for your domains)
# ALLOWED_ORIGINS=https://islandbitcoin.com,https://www.islandbitcoin.com
EOF
        
        echo "✅ Created .env file"
        echo ""
        echo "⚠️  IMPORTANT: Save this API key for your frontend configuration:"
        echo "   API_SECRET: $API_KEY"
        echo ""
        read -p "Press enter to continue..."
    else
        echo "✅ .env file already exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    echo ""
    echo "📦 Installing dependencies..."
    npm install --production
    echo "✅ Dependencies installed"
}

# Function to setup PM2
setup_pm2() {
    echo ""
    echo "🔄 Setting up PM2 process manager..."
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2 globally..."
        sudo npm install -g pm2
    fi
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'island-bitcoin-sync',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF
    
    # Create logs directory
    mkdir -p logs
    
    echo "✅ PM2 configuration created"
}

# Function to setup systemd service
setup_systemd() {
    echo ""
    echo "🔧 Setting up systemd service..."
    
    cat > island-bitcoin-sync.service << EOF
[Unit]
Description=Island Bitcoin Sync Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(which node) server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=island-bitcoin-sync
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
    
    echo "✅ Systemd service file created"
    echo ""
    echo "To install as a system service, run:"
    echo "  sudo cp island-bitcoin-sync.service /etc/systemd/system/"
    echo "  sudo systemctl daemon-reload"
    echo "  sudo systemctl enable island-bitcoin-sync"
    echo "  sudo systemctl start island-bitcoin-sync"
}

# Function to setup nginx
setup_nginx() {
    echo ""
    echo "🌐 Generating Nginx configuration..."
    
    read -p "Enter your domain name (e.g., sync.islandbitcoin.com): " DOMAIN
    
    cat > nginx-sync-server.conf << EOF
# Island Bitcoin Sync Server Nginx Configuration
# Place this file in /etc/nginx/sites-available/ and create a symlink

server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL configuration (update paths after running certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3001;
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
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
    
    echo "✅ Nginx configuration created: nginx-sync-server.conf"
    echo ""
    echo "To install Nginx configuration:"
    echo "  sudo cp nginx-sync-server.conf /etc/nginx/sites-available/$DOMAIN"
    echo "  sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/"
    echo "  sudo nginx -t"
    echo "  sudo systemctl reload nginx"
    echo ""
    echo "To setup SSL with Let's Encrypt:"
    echo "  sudo certbot --nginx -d $DOMAIN"
}

# Function to display deployment options
show_deployment_options() {
    echo ""
    echo "🚀 Deployment Options"
    echo "===================="
    echo ""
    echo "1. Deploy with PM2 (recommended for VPS)"
    echo "2. Deploy with systemd"
    echo "3. Deploy with Docker"
    echo "4. Generate Nginx configuration"
    echo "5. Run development server"
    echo "6. Exit"
    echo ""
    read -p "Select an option (1-6): " option
    
    case $option in
        1)
            deploy_pm2
            ;;
        2)
            deploy_systemd
            ;;
        3)
            deploy_docker
            ;;
        4)
            setup_nginx
            show_deployment_options
            ;;
        5)
            run_dev
            ;;
        6)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option"
            show_deployment_options
            ;;
    esac
}

# Function to deploy with PM2
deploy_pm2() {
    setup_pm2
    
    echo ""
    echo "🚀 Starting server with PM2..."
    pm2 start ecosystem.config.js
    pm2 save
    
    echo ""
    echo "✅ Server deployed with PM2!"
    echo ""
    echo "Useful PM2 commands:"
    echo "  pm2 status          - Check server status"
    echo "  pm2 logs            - View logs"
    echo "  pm2 restart all     - Restart server"
    echo "  pm2 stop all        - Stop server"
    echo ""
    echo "To enable startup on boot:"
    echo "  pm2 startup"
    echo "  (follow the instructions)"
}

# Function to deploy with systemd
deploy_systemd() {
    setup_systemd
    
    echo ""
    echo "✅ Systemd service file created!"
    echo ""
    echo "Follow the instructions above to install and start the service."
}

# Function to deploy with Docker
deploy_docker() {
    echo ""
    echo "🐳 Docker Deployment"
    echo "==================="
    
    if [ ! -f "Dockerfile" ]; then
        echo "❌ Dockerfile not found"
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed"
        echo "   Install from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    echo "Building Docker image..."
    docker build -t island-bitcoin-sync .
    
    echo ""
    echo "✅ Docker image built!"
    echo ""
    echo "To run with Docker:"
    echo "  docker run -d -p 3001:3001 --env-file .env --name island-bitcoin-sync island-bitcoin-sync"
    echo ""
    echo "Or use docker-compose (recommended):"
    echo "  docker-compose up -d"
}

# Function to run development server
run_dev() {
    echo ""
    echo "🔧 Starting development server..."
    node server.js
}

# Main execution
main() {
    check_prerequisites
    setup_environment
    install_dependencies
    show_deployment_options
}

# Run main function
main