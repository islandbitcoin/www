#!/bin/bash

# Island Bitcoin Unified Deployment Script
# Deploys both frontend and sync server together

set -e

echo "🚀 Island Bitcoin Unified Deployment"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "server" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Function to generate secure API key
generate_api_key() {
    openssl rand -hex 32
}

# Build the frontend
build_frontend() {
    echo ""
    echo "📦 Building frontend..."
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning "No .env file found. Creating one..."
        
        # Generate API key
        API_KEY=$(generate_api_key)
        
        cat > .env << EOF
# Frontend Configuration
VITE_SYNC_SERVER_URL=
VITE_SYNC_API_KEY=$API_KEY

# Other configuration
VITE_SITE_NAME="Island Bitcoin"
VITE_DEFAULT_RELAY="wss://relay.primal.net"
EOF
        
        print_success "Created .env file"
        print_warning "Update VITE_SYNC_SERVER_URL after deployment!"
    fi
    
    # Install dependencies and build
    npm install
    npm run build
    
    print_success "Frontend built successfully"
}

# Setup unified server
setup_unified_server() {
    echo ""
    echo "🔧 Setting up unified server..."
    
    cd server
    
    # Create .env if it doesn't exist
    if [ ! -f ".env" ]; then
        # Get API key from frontend .env or generate new one
        if [ -f "../.env" ]; then
            API_KEY=$(grep VITE_SYNC_API_KEY ../.env | cut -d '=' -f2)
        else
            API_KEY=$(generate_api_key)
        fi
        
        cat > .env << EOF
# Server Configuration
NODE_ENV=production
PORT=3000
API_SECRET=$API_KEY

# Redis Configuration (optional)
# REDIS_URL=redis://localhost:6379
EOF
        
        print_success "Created server .env file"
        echo ""
        print_warning "IMPORTANT: Save this API key:"
        echo "   $API_KEY"
        echo ""
    fi
    
    # Install server dependencies
    npm install
    
    cd ..
    print_success "Server setup complete"
}

# Create PM2 ecosystem file
create_pm2_config() {
    cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'island-bitcoin',
    script: './server/unified-server.js',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF
    
    mkdir -p logs
    print_success "PM2 configuration created"
}

# Create systemd service
create_systemd_service() {
    cat > island-bitcoin.service << EOF
[Unit]
Description=Island Bitcoin Web Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(which node) server/unified-server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=island-bitcoin
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF
    
    print_success "Systemd service file created"
}

# Create Docker files
create_docker_config() {
    # Create Dockerfile
    cat > Dockerfile << 'EOF'
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci
RUN cd server && npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server
COPY --from=builder /app/server ./server

# Install only production dependencies
WORKDIR /app/server
RUN npm ci --only=production

WORKDIR /app

EXPOSE 3000

CMD ["node", "server/unified-server.js"]
EOF

    # Create docker-compose.yml
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    container_name: island-bitcoin
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - API_SECRET=${API_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    networks:
      - island-bitcoin

  redis:
    image: redis:7-alpine
    container_name: island-bitcoin-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    networks:
      - island-bitcoin

networks:
  island-bitcoin:
    driver: bridge

volumes:
  redis-data:
EOF
    
    print_success "Docker configuration created"
}

# Create Nginx configuration
create_nginx_config() {
    read -p "Enter your domain name (e.g., islandbitcoin.com): " DOMAIN
    
    cat > nginx-island-bitcoin.conf << EOF
# Island Bitcoin Nginx Configuration
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to Node.js app
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
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    print_success "Nginx configuration created: nginx-island-bitcoin.conf"
}

# Deployment menu
show_deployment_menu() {
    echo ""
    echo "🚀 Deployment Options"
    echo "===================="
    echo ""
    echo "1. Deploy with PM2 (recommended for VPS)"
    echo "2. Deploy with Docker"
    echo "3. Deploy with systemd"
    echo "4. Create Nginx configuration"
    echo "5. Run development server"
    echo "6. Exit"
    echo ""
    read -p "Select an option (1-6): " option
    
    case $option in
        1)
            deploy_with_pm2
            ;;
        2)
            deploy_with_docker
            ;;
        3)
            deploy_with_systemd
            ;;
        4)
            create_nginx_config
            show_deployment_menu
            ;;
        5)
            run_dev_server
            ;;
        6)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option"
            show_deployment_menu
            ;;
    esac
}

# Deploy with PM2
deploy_with_pm2() {
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2..."
        sudo npm install -g pm2
    fi
    
    create_pm2_config
    
    echo ""
    echo "🚀 Starting application with PM2..."
    pm2 start ecosystem.config.cjs
    pm2 save
    
    print_success "Application deployed with PM2!"
    echo ""
    echo "The application is now running on port 3000"
    echo ""
    echo "Useful PM2 commands:"
    echo "  pm2 status         - Check application status"
    echo "  pm2 logs           - View logs"
    echo "  pm2 restart all    - Restart application"
    echo "  pm2 monit          - Monitor CPU and memory"
    echo ""
    echo "To enable startup on boot:"
    echo "  pm2 startup"
    echo "  (follow the instructions)"
    echo ""
    print_warning "Don't forget to:"
    echo "1. Setup Nginx reverse proxy"
    echo "2. Configure SSL with Let's Encrypt"
    echo "3. Update frontend .env with your domain"
}

# Deploy with Docker
deploy_with_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Install from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    create_docker_config
    
    echo ""
    echo "🐳 Building and starting with Docker..."
    docker-compose up -d --build
    
    print_success "Application deployed with Docker!"
    echo ""
    echo "The application is now running on port 3000"
    echo ""
    echo "Useful Docker commands:"
    echo "  docker-compose ps          - Check status"
    echo "  docker-compose logs -f     - View logs"
    echo "  docker-compose restart     - Restart application"
    echo "  docker-compose down        - Stop application"
}

# Deploy with systemd
deploy_with_systemd() {
    create_systemd_service
    
    print_success "Systemd service file created!"
    echo ""
    echo "To install and start the service:"
    echo "  sudo cp island-bitcoin.service /etc/systemd/system/"
    echo "  sudo systemctl daemon-reload"
    echo "  sudo systemctl enable island-bitcoin"
    echo "  sudo systemctl start island-bitcoin"
    echo ""
    echo "Check status with:"
    echo "  sudo systemctl status island-bitcoin"
    echo "  sudo journalctl -u island-bitcoin -f"
}

# Run development server
run_dev_server() {
    echo ""
    echo "🔧 Starting development server..."
    node server/unified-server.js
}

# Main execution
main() {
    echo ""
    echo "This script will deploy Island Bitcoin as a unified application"
    echo "(frontend + API server in one deployment)"
    echo ""
    
    # Build frontend
    build_frontend
    
    # Setup server
    setup_unified_server
    
    # Show deployment options
    show_deployment_menu
}

# Run main
main