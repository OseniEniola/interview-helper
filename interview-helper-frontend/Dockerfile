# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /usr/src/frontend

# Install deps
COPY interview-helper-frontend/package.json interview-helper-frontend/package-lock.json ./
RUN npm ci --silent

# Copy rest of the frontend code
COPY interview-helper-frontend/ ./

# Build (adjust if using yarn or pnpm)
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN npm run build

# Stage 2: nginx serve
FROM nginx:stable-alpine
COPY --from=builder /usr/src/frontend/dist /usr/share/nginx/html

# Remove default config and use a basic one (optional: add custom config)
RUN rm /etc/nginx/conf.d/default.conf
COPY interview-helper-frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy self-signed certs
COPY ./certs/fullchain.pem /etc/ssl/certs/fullchain.pem
COPY ./certs/privkey.pem /etc/ssl/private/privkey.pem

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
