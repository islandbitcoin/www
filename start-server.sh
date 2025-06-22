#!/bin/bash

echo "🚀 Starting Island Bitcoin Sync Server..."

# Check if we're in the right directory
if [ ! -d "server" ]; then
    echo "❌ Server directory not found. Please run this script from the project root."
    exit 1
fi

# Navigate to server directory
cd server

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing server dependencies..."
    npm install
fi

# Start the server
echo "🌊 Starting sync server on port 3001..."
npm start