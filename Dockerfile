# Use official Node.js 22 Alpine image (lightweight & built-in node:sqlite)
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Install dependencies (only production)
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose server port
EXPOSE 3000

# Health check to ensure store is responsive
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/categories').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start FlixStore Platform
CMD ["npm", "start"]
