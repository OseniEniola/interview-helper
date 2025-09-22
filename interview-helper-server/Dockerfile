# Stage 1: deps + build
FROM node:20-alpine AS builder
WORKDIR /usr/src/backend

# Copy dependency files and install
COPY interview-helper-server/package.json interview-helper-server/package-lock.json ./
RUN npm ci --silent

# Copy rest of source
COPY interview-helper-server/ ./

# Generate prisma client
RUN npx prisma generate

# Build TS to JS
RUN npm run build

# Stage 2: runtime
FROM node:20-alpine AS runner
WORKDIR /usr/src/backend

ENV NODE_ENV=production

# Copy from builder
COPY --from=builder /usr/src/backend/node_modules ./node_modules
COPY --from=builder /usr/src/backend/dist ./dist
COPY --from=builder /usr/src/backend/prisma ./prisma
COPY --from=builder /usr/src/backend/package.json ./package.json

EXPOSE 4000

# Run migrations before starting
CMD sh -c "npx prisma migrate deploy && npm start"
