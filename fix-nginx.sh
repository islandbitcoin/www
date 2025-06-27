#!/bin/bash

# Script to update nginx configuration for Island Bitcoin

echo "🔧 Updating Nginx configuration..."

# Common nginx config paths
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# Find the site config
SITE_CONFIG=""
for config in community.islandbitcoin.com islandbitcoin default; do
    if [ -f "$NGINX_SITES/$config" ]; then
        SITE_CONFIG="$NGINX_SITES/$config"
        break
    fi
done

if [ -z "$SITE_CONFIG" ]; then
    echo "❌ Could not find nginx site configuration"
    echo "Please manually update your nginx config to proxy to port 3001"
    exit 1
fi

echo "📝 Found nginx config: $SITE_CONFIG"

# Backup the original
cp "$SITE_CONFIG" "$SITE_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"

# Update the proxy_pass port from 3000 to 3001
sed -i 's/proxy_pass http:\/\/localhost:3000/proxy_pass http:\/\/localhost:3001/g' "$SITE_CONFIG"

# Remove any rate limiting
sed -i '/limit_req/d' "$SITE_CONFIG"
sed -i '/limit_req_zone/d' "$SITE_CONFIG"

echo "✓ Updated proxy_pass to use port 3001"
echo "✓ Removed rate limiting directives"

# Test nginx config
echo "🧪 Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Nginx configuration is valid"
    echo "🔄 Reloading nginx..."
    systemctl reload nginx
    echo "✓ Nginx reloaded successfully"
else
    echo "❌ Nginx configuration test failed"
    echo "Restoring backup..."
    cp "$SITE_CONFIG.backup.$(date +%Y%m%d_%H%M%S)" "$SITE_CONFIG"
    exit 1
fi

echo ""
echo "✅ Nginx configuration updated successfully!"
echo ""
echo "You can now test the API endpoint:"
echo "  curl https://community.islandbitcoin.com/api/health"