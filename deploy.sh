#!/bin/bash

# Island Bitcoin Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Starting Island Bitcoin deployment..."

# Configuration
DEPLOY_BRANCH=${1:-digitalocean}
NODE_ENV=${NODE_ENV:-production}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Pull latest changes
print_status "Pulling latest changes from $DEPLOY_BRANCH branch..."
git fetch origin
git checkout $DEPLOY_BRANCH
git pull origin $DEPLOY_BRANCH

# Install/update dependencies for the main app
print_status "Installing main app dependencies..."
npm install

# Build the frontend
print_status "Building frontend..."
npm run build

# Install/update server dependencies
print_status "Installing server dependencies..."
cd server
npm install

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing PM2 globally..."
    sudo npm install -g pm2
fi

# Stop existing server (if running)
print_status "Stopping existing server..."
pm2 stop island-bitcoin-server || true

# Start the server with PM2
print_status "Starting server with PM2..."
pm2 start unified-server.js --name island-bitcoin-server --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot (only needs to be done once)
if [ ! -f "/etc/systemd/system/pm2-$USER.service" ]; then
    print_status "Setting up PM2 startup..."
    pm2 startup systemd -u $USER --hp $HOME
fi

# Show server status
print_status "Server status:"
pm2 status island-bitcoin-server

# Test the server
print_status "Testing server health endpoint..."
sleep 2
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "Server is healthy!"
else
    print_error "Server health check failed!"
    pm2 logs island-bitcoin-server --lines 50
    exit 1
fi

# Show logs
print_status "Recent server logs:"
pm2 logs island-bitcoin-server --lines 20 --nostream

echo ""
print_status "Deployment complete! 🎉"
echo ""
echo "Useful commands:"
echo "  - View logs: pm2 logs island-bitcoin-server"
echo "  - Restart server: pm2 restart island-bitcoin-server"
echo "  - Stop server: pm2 stop island-bitcoin-server"
echo "  - Monitor: pm2 monit"