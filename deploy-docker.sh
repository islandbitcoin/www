#!/bin/bash

# Island Bitcoin Docker Deploy Script
# One-liner deployment: curl -sSL https://raw.githubusercontent.com/islandbitcoin/www/main/deploy-docker.sh | bash

set -e

echo "🚀 Island Bitcoin Docker Deployment"
echo "==================================="
echo ""

# Check Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "   Install from: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    echo "   Install from: https://docs.docker.com/compose/install/"
    exit 1
fi

# Clone repository
if [ ! -d "www" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/islandbitcoin/www.git
fi

cd www

# Generate API key if .env doesn't exist
if [ ! -f ".env" ]; then
    echo "🔑 Generating secure API key..."
    API_KEY=$(openssl rand -hex 32)
    cat > .env << EOF
# Island Bitcoin Configuration
API_SECRET=$API_KEY
NODE_ENV=production
EOF
    echo ""
    echo "⚠️  IMPORTANT: Save this API key for your frontend configuration:"
    echo "   $API_KEY"
    echo ""
fi

# Build and start
echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.unified.yml build

echo "🚀 Starting services..."
docker-compose -f docker-compose.unified.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Access your app at: http://localhost:3000"
    echo "📊 Health check: http://localhost:3000/api/health"
    echo ""
    echo "📝 Useful commands:"
    echo "   View logs:  docker-compose -f docker-compose.unified.yml logs -f"
    echo "   Stop:       docker-compose -f docker-compose.unified.yml down"
    echo "   Restart:    docker-compose -f docker-compose.unified.yml restart"
else
    echo ""
    echo "⚠️  Services are still starting. Check logs with:"
    echo "   docker-compose -f docker-compose.unified.yml logs -f"
fi