# Use AWS ECR Public Node image to avoid Docker Hub rate limits
FROM public.ecr.aws/docker/library/node:24-slim AS base

# 1. Install dependencies only when needed
FROM base AS deps
# Install build tools for native dependencies (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci


# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build


# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Disable Next.js telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED 1

# Install gosu for dropping privileges in entrypoint (su-exec is Alpine-only, gosu is for Debian)
RUN apt-get update && apt-get install -y --no-install-recommends gosu && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure the database directory exists and is writable by the non-root user
# The entrypoint script will fix permissions at runtime for mounted volumes
RUN mkdir -p data && \
    chown -R nextjs:nodejs data && \
    chmod 755 data

VOLUME /app/data

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Note: We don't set USER here because the entrypoint needs to run as root
# to fix volume permissions, then it drops privileges to nextjs user

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# Healthcheck using the /api/health endpoint
# We use node to perform the check to avoid adding extra dependencies like curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => res.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"

# Use entrypoint to handle permissions and privilege dropping
ENTRYPOINT ["docker-entrypoint.sh"]

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]
