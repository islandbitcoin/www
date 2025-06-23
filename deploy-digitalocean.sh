#!/bin/bash

# Island Bitcoin - DigitalOcean Deployment Script
# This script helps deploy updates to your DigitalOcean droplet

set -e

echo "🏝️ Island Bitcoin - DigitalOcean Deployment"
echo "=========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Create one from .env.example and configure it."
    exit 1
fi

# Load specific required variables safely
if [ -f .env ]; then
    DOMAIN=$(grep "^DOMAIN=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
else
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Check required variables
if [ -z "$DOMAIN" ]; then
    echo "❌ Error: DOMAIN not set in .env file!"
    echo "Please add: DOMAIN=yourdomain.com to your .env file"
    exit 1
fi

echo "📦 Building application..."
docker compose build --no-cache

echo "🚀 Starting services..."
docker compose down
docker compose up -d

echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment complete!"
echo ""
echo "📊 Check status with:"
echo "  docker compose ps"
echo "  docker compose logs -f app"
echo ""
echo "🌐 Your site is currently available at:"
echo "  http://$DOMAIN"
echo ""
echo "🔒 Need SSL? Run:"
echo "  sudo ./setup-ssl.sh"
echo ""
echo "💡 Tips:"
echo "  - Monitor logs: docker compose logs -f"
echo "  - Check health: curl http://localhost:3000/api/health"
echo "  - View stats: docker stats"