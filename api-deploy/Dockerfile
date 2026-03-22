# -------- BUILD STAGE --------
FROM node:20-alpine AS builder

WORKDIR /app

# deps système (bcrypt / prisma)
RUN apk add --no-cache python3 make g++ openssl

# install deps
COPY package*.json ./
RUN npm install

# copy code
COPY tsconfig*.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src

# prisma
RUN npx prisma generate --schema ./prisma/schema.prisma

# build
RUN npm run build


# -------- PRODUCTION STAGE --------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# deps runtime seulement
COPY package*.json ./
RUN npm install --omit=dev

# copy build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# port Railway (important)
EXPOSE 3000

# start
CMD ["node", "dist/main.js"]