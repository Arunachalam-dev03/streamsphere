# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Install ffmpeg and openssl (required by Prisma)
RUN apk add --no-cache ffmpeg openssl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Regenerate Prisma client for the production Alpine platform
RUN npx prisma generate

RUN mkdir -p uploads/temp media/live

# Copy startup script
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 5000 1935

CMD ["./entrypoint.sh"]
