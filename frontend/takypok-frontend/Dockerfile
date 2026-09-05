FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# Copy workspace manifests first so `pnpm install` is cached unless deps change
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc package.json ./
COPY packages packages
COPY takypok-frontend takypok-frontend

# Only install takypok-frontend and the workspace packages it depends on
# (skips mobile-frontend, which isn't part of this pnpm workspace anyway)
RUN pnpm install --filter takypok-frontend... --frozen-lockfile

WORKDIR /app/takypok-frontend

# Vite inlines VITE_* vars at build time — use the checked-in example values as the
# default config for local Docker Desktop runs (they already point at the ports the
# other services publish: gateway-service:8080, auth-service:9000).
COPY takypok-frontend/.env.example .env

RUN pnpm build

FROM nginx:1.27-alpine
COPY --from=builder /app/takypok-frontend/dist /usr/share/nginx/html
COPY takypok-frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
