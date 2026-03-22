# SKY PLAY Platform - Guide de Démarrage

## Prérequis

- Node.js v20.19.4
- pnpm v10.22.0
- Docker Desktop

## Installation

### 1. Installer les dépendances

```bash
pnpm install
```

### 2. Configuration de l'environnement

```bash
cp .env.example .env
```

Éditez `.env` et configurez:
- `DATABASE_URL` (PostgreSQL)
- `REDIS_URL`
- `JWT_SECRET`
- Clés de paiement Flutterwave

### 3. Démarrer Docker (PostgreSQL + Redis)

```bash
pnpm docker:check
```

Ou manuellement:

```bash
cd infrastructure/docker
docker compose up -d
```

### 4. Configuration de la base de données

```bash
cd database
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Démarrer les services

**Terminal 1 - Application Web:**
```bash
pnpm dev:web
```
→ http://localhost:3000

**Terminal 2 - API Backend:**
```bash
pnpm dev:api
```
→ http://localhost:4000

**Terminal 3 - Gateway Realtime:**
```bash
pnpm dev:realtime
```
→ ws://localhost:4001

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:3000 | Interface utilisateur |
| API | http://localhost:4000 | Backend NestJS |
| WebSocket | ws://localhost:4001 | Notifications temps réel |
| PostgreSQL | localhost:5432 | Base de données |
| Redis | localhost:6379 | Cache |

## Commandes utiles

```bash
# Vérifier Docker
pnpm docker:check

# Arrêter Docker
cd infrastructure/docker
docker compose down

# Voir les logs
docker compose logs -f

# Réinitialiser la base de données
cd database
npx prisma migrate reset
```

## Repository Git

https://github.com/zefparis/SKY-PLAY-Platform.git
