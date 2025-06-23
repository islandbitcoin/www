# Island Bitcoin Unified Server

This is the unified server that serves both the frontend static files and the configuration API for Island Bitcoin.

## Overview

The unified server (`unified-server.js`) provides:
- Static file serving for the React frontend
- Configuration sync API for game wallet settings
- Redis caching for improved performance
- Health check endpoint for monitoring

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/config` - Get game configuration (requires authentication)
- `POST /api/config` - Update game configuration (requires authentication)
- `DELETE /api/config` - Remove game configuration (requires authentication)

## Authentication

API endpoints require the `x-api-key` header with the value matching the `API_SECRET` environment variable.

## Environment Variables

See the main `.env.example` file for required environment variables.

## Running Locally

```bash
# Install dependencies
npm install

# Start server
node unified-server.js
```

## Docker Deployment

The server is automatically built and deployed as part of the main Docker Compose setup. See the main DEPLOYMENT.md for details.