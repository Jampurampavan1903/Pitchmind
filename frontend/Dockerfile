# Stage 1: Install dependencies only when package.json or package-lock.json changes
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Rebuild Next.js source code
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set Next.js build-time environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

RUN npm run build

# Stage 3: Direct runner using Next.js standalone execution mode for minimal sizes
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1

# Create standard unprivileged runtime user context
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy compiled resources and system settings
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

# Start Next.js optimized production server
CMD ["npm", "run", "start"]
