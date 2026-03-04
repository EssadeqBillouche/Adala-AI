FROM node:20-alpine AS base

WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source and build
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Production image
FROM node:20-alpine AS prod
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=base /usr/src/app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]