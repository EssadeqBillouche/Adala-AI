# Frontend (Next.js) Dockerfile
FROM node:26-alpine AS base

WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# Production image
FROM node:26-alpine AS prod

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files and install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=base /usr/src/app/.next ./.next
COPY --from=base /usr/src/app/public ./public
COPY --from=base /usr/src/app/package.json ./

# Expose Next.js default port
EXPOSE 3000

# Use Next.js standalone server
CMD ["npm", "start"]
