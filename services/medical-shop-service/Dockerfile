FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/shops uploads/medicines uploads/documents/shops uploads/documents/medicines

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S medicalshopservice -u 1001

# Change ownership
RUN chown -R medicalshopservice:nodejs /app
USER medicalshopservice

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

CMD ["npm", "start"]
