#!/bin/bash

# Island Bitcoin - One-Click Deployment Script
# Supports: Vercel, Netlify, GitHub Pages, and Docker

set -e

echo "🏝️ Island Bitcoin Deployment Script"
echo "=================================="

# Function to display menu
show_menu() {
    echo "Select deployment platform:"
    echo "1) Vercel"
    echo "2) Netlify"
    echo "3) GitHub Pages"
    echo "4) Docker"
    echo "5) Generate static files only"
    echo "6) Exit"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    npm install
}

# Function to build the project
build_project() {
    echo "🔨 Building project..."
    npm run build
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "🚀 Deploying to Vercel..."
    
    if ! command_exists vercel; then
        echo "Installing Vercel CLI..."
        npm i -g vercel
    fi
    
    # Create vercel.json if it doesn't exist
    if [ ! -f "vercel.json" ]; then
        cat > vercel.json << EOF
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
EOF
    fi
    
    vercel --prod
}

# Function to deploy to Netlify
deploy_netlify() {
    echo "🚀 Deploying to Netlify..."
    
    if ! command_exists netlify; then
        echo "Installing Netlify CLI..."
        npm i -g netlify-cli
    fi
    
    # Create netlify.toml if it doesn't exist
    if [ ! -f "netlify.toml" ]; then
        cat > netlify.toml << EOF
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/manifest.webmanifest"
  [headers.values]
    Content-Type = "application/manifest+json"
EOF
    fi
    
    netlify deploy --prod --dir=dist
}

# Function to deploy to GitHub Pages
deploy_github_pages() {
    echo "🚀 Deploying to GitHub Pages..."
    
    # Check if gh-pages branch exists
    if ! git show-ref --verify --quiet refs/heads/gh-pages; then
        git checkout -b gh-pages
    else
        git checkout gh-pages
    fi
    
    # Copy dist contents
    cp -r dist/* .
    
    # Add CNAME if provided
    read -p "Enter your custom domain (or press Enter to skip): " domain
    if [ ! -z "$domain" ]; then
        echo "$domain" > CNAME
    fi
    
    # Commit and push
    git add .
    git commit -m "Deploy to GitHub Pages"
    git push origin gh-pages
    
    git checkout main
    
    echo "✅ Deployed! Your site will be available at:"
    if [ ! -z "$domain" ]; then
        echo "https://$domain"
    else
        echo "https://[username].github.io/[repo]"
    fi
}

# Function to deploy with Docker
deploy_docker() {
    echo "🐳 Building Docker image..."
    
    # Create Dockerfile if it doesn't exist
    if [ ! -f "Dockerfile" ]; then
        cat > Dockerfile << EOF
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF
    fi
    
    # Create nginx.conf if it doesn't exist
    if [ ! -f "nginx.conf" ]; then
        cat > nginx.conf << EOF
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /manifest.webmanifest {
        add_header Content-Type application/manifest+json;
    }

    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
EOF
    fi
    
    # Build Docker image
    docker build -t island-bitcoin .
    
    echo "✅ Docker image built!"
    echo "Run with: docker run -p 8080:80 island-bitcoin"
}

# Function to customize environment
customize_env() {
    echo "🎨 Customizing your deployment..."
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
    fi
    
    read -p "Site name (default: Island Bitcoin): " site_name
    read -p "Site tagline (default: Bitcoin in Paradise): " tagline
    read -p "Community location (default: Caribbean): " location
    read -p "Primary color hex (default: #FF6B35): " primary_color
    read -p "Accent color hex (default: #00A5CF): " accent_color
    
    # Update .env file
    if [ ! -z "$site_name" ]; then
        sed -i.bak "s/VITE_SITE_NAME=.*/VITE_SITE_NAME=\"$site_name\"/" .env
    fi
    if [ ! -z "$tagline" ]; then
        sed -i.bak "s/VITE_SITE_TAGLINE=.*/VITE_SITE_TAGLINE=\"$tagline\"/" .env
    fi
    if [ ! -z "$location" ]; then
        sed -i.bak "s/VITE_COMMUNITY_LOCATION=.*/VITE_COMMUNITY_LOCATION=\"$location\"/" .env
    fi
    if [ ! -z "$primary_color" ]; then
        sed -i.bak "s/VITE_THEME_COLOR=.*/VITE_THEME_COLOR=\"$primary_color\"/" .env
    fi
    if [ ! -z "$accent_color" ]; then
        sed -i.bak "s/VITE_ACCENT_COLOR=.*/VITE_ACCENT_COLOR=\"$accent_color\"/" .env
    fi
    
    rm -f .env.bak
    echo "✅ Configuration updated!"
}

# Main script
main() {
    # Check if npm is installed
    if ! command_exists npm; then
        echo "❌ Error: npm is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Ask if user wants to customize
    read -p "Would you like to customize the site configuration? (y/n): " customize
    if [ "$customize" = "y" ] || [ "$customize" = "Y" ]; then
        customize_env
    fi
    
    # Install dependencies
    install_deps
    
    # Build project
    build_project
    
    # Show deployment menu
    while true; do
        show_menu
        read -p "Enter your choice (1-6): " choice
        
        case $choice in
            1)
                deploy_vercel
                break
                ;;
            2)
                deploy_netlify
                break
                ;;
            3)
                deploy_github_pages
                break
                ;;
            4)
                deploy_docker
                break
                ;;
            5)
                echo "✅ Build complete! Files are in the 'dist' directory."
                break
                ;;
            6)
                echo "👋 Goodbye!"
                exit 0
                ;;
            *)
                echo "❌ Invalid choice. Please try again."
                ;;
        esac
    done
    
    echo ""
    echo "🎉 Deployment complete!"
    echo "Don't forget to:"
    echo "- Update your DNS settings if using a custom domain"
    echo "- Configure your Nostr relays in the app settings"
    echo "- Join the Island Bitcoin community!"
}

# Run main function
main