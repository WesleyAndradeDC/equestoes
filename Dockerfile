# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Same-origin: frontend chama /api, nginx faz proxy pro backend.
# Default /api evita URL errada baked no build.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── Serve stage ───────────────────────────────────────────────
FROM nginx:alpine

RUN apk add --no-cache curl

COPY --from=builder /app/dist /usr/share/nginx/html
# nginx:alpine roda envsubst nos *.template → /etc/nginx/conf.d/ no boot
COPY nginx.default.conf.template /etc/nginx/templates/default.conf.template

# BACKEND_URL sobrescrito em runtime no Coolify
ENV BACKEND_URL=http://backend:3000

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
