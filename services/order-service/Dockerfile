# Stage 1 - Builder
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json .

RUN npm install --only=production

# Stage 2 - Production
FROM node:18-alpine AS production

# Security - Non-root user banao
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Builder se sirf node_modules copy karo
COPY --from=builder /app/node_modules ./node_modules

# Application code copy karo
COPY src/ ./src/
COPY package.json .

# Non-root user use karo
USER appuser

EXPOSE 3003

CMD ["node", "src/index.js"]