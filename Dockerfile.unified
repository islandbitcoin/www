# Unified Dockerfile - Frontend + API Server
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

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server
COPY --from=builder /app/server ./server

# Install only production dependencies
WORKDIR /app/server
RUN npm ci --only=production

WORKDIR /app

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start unified server
CMD ["node", "server/unified-server.js"]