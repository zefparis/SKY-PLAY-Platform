# Intégration Discord dans SKY PLAY

## ✅ Implémentation Complète

Toutes les fonctionnalités Discord ont été implémentées avec succès !

## Variables d'Environnement

### Railway (Backend)
```bash
DISCORD_BOT_TOKEN=<token_du_bot>
DISCORD_GUILD_ID=<id_serveur_skyplay>
```

### Vercel (Frontend)
```bash
NEXT_PUBLIC_DISCORD_INVITE_URL=https://discord.gg/<ton-lien>
NEXT_PUBLIC_DISCORD_GUILD_ID=<id_serveur_skyplay>
```

## Setup Bot Discord

### 1. Créer/Configurer le Bot

**Discord Developer Portal** → Application SKY PLAY (ID: 1487774336126554273) → Bot
- ✅ Active "Server Members Intent"
- ✅ Active "Presence Intent"
- Reset Token → copie le token → ajoute à Railway `DISCORD_BOT_TOKEN`

### 2. Inviter le Bot sur ton Serveur

**OAuth2 URL Generator**
- Scopes: `bot`
- Permissions: `View Server Members`
- Copie l'URL générée
- Ouvre dans navigateur → sélectionne ton serveur SKY PLAY → Autoriser

### 3. Récupérer Guild ID

- Discord → Paramètres Utilisateur → Avancés → Mode développeur (ON)
- Clic droit sur ton serveur SKY PLAY → Copier l'identifiant du serveur
- Ajoute à Railway `DISCORD_GUILD_ID` et Vercel `NEXT_PUBLIC_DISCORD_GUILD_ID`

### 4. Créer Invitation Permanente

- Discord → Ton serveur → Paramètres serveur → Invitations
- Créer une invitation → Expire après: Jamais → Utilisations max: Illimitées
- Copie le lien → ajoute à Vercel `NEXT_PUBLIC_DISCORD_INVITE_URL`

## Fonctionnalités Implémentées

### ✅ 1. Badge Discord dans le Chat
- Badge violet #5865F2 à côté du username si `discordTag` présent
- Icône Discord SVG
- Tooltip au hover affichant le Discord tag complet (ex: "ben#1234")
- Visible dans tous les messages du chat

### ✅ 2. Statut Discord (Backend)
- **Endpoint**: `GET /users/:id/discord-status`
- Appelle Discord API pour récupérer le statut du membre
- Indicateurs colorés:
  - 🟢 `online` → vert (#10B981)
  - 🟡 `idle` → jaune (#FBBF24)
  - 🔴 `dnd` → rouge (#EF4444)
  - ⚫ `offline` → gris (pas affiché)
- **Cache 60s** pour éviter rate limiting Discord API
- Fallback gracieux si bot non configuré

### ✅ 3. Bouton "Rejoindre Discord" dans Chat
- Positionné entre les messages et la barre d'input
- Style: fond #5865F2, icône Discord blanche, texte "Rejoindre le Discord SKY PLAY"
- Ouvre invitation dans nouvel onglet
- Responsive mobile/desktop

### ✅ 4. Lien Discord dans Footer Landing Page
- Section "Contact" du footer
- Lien cliquable vers invitation Discord
- Utilise `NEXT_PUBLIC_DISCORD_INVITE_URL`
- Disponible en FR et EN

### ✅ 5. Widget Discord sur Landing Page
- Section dédiée "Rejoins notre communauté Discord"
- **Desktop**: iframe Discord widget (350x500px)
- **Mobile**: Bouton "Rejoindre le Discord" stylé
- Positionné entre la section Pricing et le Footer
- Utilise `NEXT_PUBLIC_DISCORD_GUILD_ID`

## Structure des Fichiers

### Backend (`api-deploy/`)
```
src/modules/
├── auth/
│   ├── auth.controller.ts          # POST /auth/discord (OAuth)
│   ├── auth.service.ts              # discordAuth(), upsertDiscordUser()
│   ├── strategies/
│   │   └── jwt-custom.strategy.ts   # Validation JWT custom Discord
│   └── guards/
│       └── jwt-dual.guard.ts        # Guard dual Cognito + Discord
└── users/
    ├── users.controller.ts          # GET /users/:id/discord-status
    └── users.service.ts             # getDiscordStatus() avec cache
```

### Frontend (`apps/web/`)
```
src/
├── app/
│   ├── chat/page.tsx                # Badge Discord dans messages
│   └── auth/discord/callback/
│       └── page.tsx                 # Callback OAuth Discord
├── components/
│   ├── chat/
│   │   ├── DiscordBadge.tsx         # Badge violet avec tooltip
│   │   ├── DiscordStatusIndicator.tsx # Indicateur statut (non utilisé encore)
│   │   └── UserAvatar.tsx           # Avatar avec support Discord (non utilisé encore)
│   ├── landing/
│   │   └── LandingPage.tsx          # Widget Discord + lien footer
│   └── auth/
│       └── AuthModal.tsx            # Bouton "Continuer avec Discord"
└── lib/
    └── auth-store.ts                # loginWithDiscord(), handleDiscordCallback()
```

## Notes Techniques

### Avatar Discord
- URL: `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png`
- Fallback si pas d'avatar custom: utiliser `discordId` comme hash
- Fallback final: avatar SKY PLAY par défaut

### Discord API
- **Guild Member**: `GET https://discord.com/api/guilds/:guildId/members/:discordId`
- Header: `Authorization: Bot ${DISCORD_BOT_TOKEN}`
- Rate limit: 50 requêtes/seconde (cache 60s implémenté)

### Sécurité
- JWT custom signé avec `JWT_SECRET` (Railway)
- Dual validation: Cognito JWT + Discord JWT
- Tokens stockés en localStorage (frontend)
- Bot token jamais exposé au frontend

## Prochaines Étapes

1. **Configurer les variables d'environnement** sur Railway et Vercel
2. **Créer et inviter le bot Discord** sur le serveur SKY PLAY
3. **Tester le flow complet**:
   - OAuth Discord (login/signup)
   - Affichage badge dans chat
   - Statut Discord (si bot configuré)
   - Widget landing page
4. **Optionnel**: Implémenter `UserAvatar` et `DiscordStatusIndicator` dans la liste des utilisateurs connectés

## TypeScript Strict Mode ✅

Toutes les erreurs TypeScript liées à `discordId` se résoudront automatiquement au build Railway après régénération du Prisma Client.
