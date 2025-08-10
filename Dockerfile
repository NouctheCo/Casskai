# ===== BASE STAGE =====
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# ===== DEVELOPMENT DEPENDENCIES STAGE =====
FROM base AS deps

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# ===== BUILD DEPENDENCIES STAGE =====
FROM base AS build-deps

# Install all dependencies (including dev dependencies)
RUN npm ci

# ===== BUILD STAGE =====
FROM build-deps AS build

# Copy source code
COPY . .

# Build the application
ENV NODE_ENV=production
RUN npm run build

# ===== RUNTIME STAGE =====
FROM nginx:1.29-alpine AS runtime

# Install security updates
RUN apk update && apk upgrade

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy production dependencies (if needed for SSR)
COPY --from=deps /app/node_modules /app/node_modules

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set correct permissions
RUN chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    chown -R nextjs:nodejs /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nextjs:nodejs /var/run/nginx.pid

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 80

# Start nginx
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]

# ===== METADATA =====
LABEL maintainer="CassKai Team <team@casskai.app>"
LABEL org.opencontainers.image.source="https://github.com/casskai/casskai"
LABEL org.opencontainers.image.description="CassKai - Plateforme de gestion financière"
LABEL org.opencontainers.image.version="1.0.0"