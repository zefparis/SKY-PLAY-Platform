# System Design

## Frontend
- apps/web: Next.js PWA, Tailwind, app router
- apps/admin: Next.js admin dashboard
- packages/ui: design system base sur la charte SKY PLAY

## Backend
- services/api: NestJS modulaire
- services/realtime-gateway: WebSocket gateway pour chat, notifications, live status

## Data
- PostgreSQL: source of truth
- Redis: sessions, cache, pubsub, rate limit, matchmaking transient state
- S3: avatars, screenshots de resultats, preuves de litiges

## Payments
- Payment adapters: Flutterwave, Stripe
- Wallet ledger interne
- Deposit / entry fee / payout / withdrawal

## Infra
- Cloudflare -> ECS -> API / Web / Admin
- RDS PostgreSQL
- ElastiCache Redis
- S3 assets
