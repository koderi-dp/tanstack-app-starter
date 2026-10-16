# syntax=docker/dockerfile:1.7
# Production multi-stage image (node-server Nitro preset).
#
#   docker compose up --build

# --- deps + compile -----------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app

ENV npm_config_fund=false
ENV npm_config_audit=false
ENV NITRO_PRESET=node-server

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY tsconfig.json vite.config.ts components.json ./
COPY migrations ./migrations
COPY tooling ./tooling
COPY src ./src

RUN NODE_ENV=production vite build

# --- runtime ------------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

COPY --from=build /app/.output ./.output
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/tooling/migrate.mjs ./tooling/migrate.mjs
COPY --from=build /app/tooling/migration-plan.mjs ./tooling/migration-plan.mjs

EXPOSE 3000
CMD ["sh", "-c", "node tooling/migrate.mjs && node .output/server/index.mjs"]
