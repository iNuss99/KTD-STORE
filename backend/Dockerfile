# ==========================================
# Multi-stage Dockerfile for NestJS Backend
# ==========================================

# 1. Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native packages (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 2. Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies for native binaries
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD [ node, dist/main]
