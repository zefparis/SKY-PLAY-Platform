# -------- BUILD STAGE --------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate --schema ./prisma/schema.prisma
RUN npm run build

# -------- PRODUCTION STAGE --------
FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 🔥 important pour runtime prisma
RUN npx prisma generate --schema ./prisma/schema.prisma

# 🔐 sécurité
RUN useradd -m appuser
USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]