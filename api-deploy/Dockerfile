# -------- BUILD STAGE --------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Root workspace metadata
COPY package.json package-lock.json ./

# Workspace metadata
COPY api-deploy/package.json ./api-deploy/package.json

# Install deps for the workspace
RUN npm ci --workspace=api-deploy

# Copy workspace sources
COPY api-deploy/tsconfig*.json ./api-deploy/
COPY api-deploy/nest-cli.json ./api-deploy/
COPY api-deploy/prisma ./api-deploy/prisma
COPY api-deploy/src ./api-deploy/src

WORKDIR /app/api-deploy

RUN npx prisma generate --schema ./prisma/schema.prisma
RUN npm run build

# -------- PRODUCTION STAGE --------
FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Root workspace metadata
COPY package.json package-lock.json ./

# Workspace metadata
COPY api-deploy/package.json ./api-deploy/package.json

# Install prod deps only for the workspace
RUN npm ci --omit=dev --workspace=api-deploy

WORKDIR /app/api-deploy

COPY --from=builder /app/api-deploy/dist ./dist
COPY --from=builder /app/api-deploy/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma

RUN useradd -m appuser
USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]