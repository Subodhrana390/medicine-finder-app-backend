FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Copy sensitive configuration files (if they exist)
# Note: These should be mounted as volumes in production
COPY src/config/service-account.json* ./src/config/
COPY src/config/client_secret*.json* ./src/config/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S authservice -u 1001

# Change ownership
RUN chown -R authservice:nodejs /app
USER authservice

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["npm", "start"]
