# Use Node 22 with Python for native modules
FROM node:22-slim

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files for workspaces
COPY package*.json ./
COPY server/package*.json ./server/

# Install all dependencies including dev (needed for TypeScript build)
RUN npm install --workspace=server

# Copy server source
COPY server/ ./server/

# Build TypeScript
RUN npm run build --workspace=server

# Remove dev dependencies after build to reduce image size
RUN npm prune --workspace=server --omit=dev

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "run", "start", "--workspace=server"]
