# 🚨 Variables d'environnement Railway - Configuration complète

## Variables obligatoires pour api-deploy

### 1. Base de données PostgreSQL
```bash
DATABASE_URL=postgresql://postgres:gRFzMXaGjAsvnCwCHwUAHMNSCffYFFIq@gondola.proxy.rlwy.net:20306/railway
```
**Source :** Railway PostgreSQL service
**Comment récupérer :** Railway Dashboard → PostgreSQL → Variables → DATABASE_URL

---

### 2. AWS Cognito (Authentification)
```bash
AWS_COGNITO_REGION=eu-west-1
AWS_COGNITO_USER_POOL_ID=eu-west-1_szNqQAkay
AWS_COGNITO_CLIENT_ID=5f29473pmgndvnqlavstf8abnu
```
**Source :** AWS Cognito Console
**Détails :**
- User Pool ID : `eu-west-1_szNqQAkay`
- Client ID : `5f29473pmgndvnqlavstf8abnu`
- Region : `eu-west-1`

---

### 3. AWS S3 (Upload d'avatars)
```bash
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=<votre_access_key_IAM>
AWS_SECRET_ACCESS_KEY=<votre_secret_key_IAM>
AWS_S3_BUCKET_NAME=skyplay
```
**Source :** AWS IAM Console
**Comment récupérer :**
1. AWS Console → IAM → Users
2. Sélectionner l'utilisateur IAM
3. Security credentials → Create access key
4. Copier Access Key ID et Secret Access Key

**Bucket :** `skyplay` (doit exister dans S3)

---

### 4. CORS Origins (Frontend)
```bash
CORS_ORIGINS=http://localhost:3000,https://sky-play-platform.vercel.app
```
**Détails :**
- Ajouter tous les domaines frontend autorisés
- Séparer par des virgules (pas d'espaces)
- Inclure localhost pour développement
- Inclure le domaine Vercel de production

---

### 5. JWT Secret (Authentification custom)
```bash
JWT_SECRET=g622Lf6UOI6HzhslTGTryOqxFvf7KPNy8H0sm5wXdLA=
```
**Détails :**
- Utilisé pour valider les tokens custom JWT (Discord, email/password)
- **IMPORTANT:** Cette valeur est déjà configurée sur Railway - ne pas la changer

---

### 6. Cloudinary (Upload screenshots chat)
```bash
CLOUDINARY_CLOUD_NAME=dxeazyhm7
CLOUDINARY_API_KEY=643428897634476
CLOUDINARY_API_SECRET=wZqKmdGIkYWIKGmcMOUZK8mbl-k
```
**Détails :**
- Utilisé pour l'upload de screenshots dans le chat
- Les credentials sont du compte Cloudinary du projet

---

### 7. Application
```bash
NODE_ENV=production
PORT=4000
```
**Détails :**
- `NODE_ENV` : toujours `production` sur Railway
- `PORT` : Railway assigne automatiquement, mais 4000 par défaut

---

## Résumé - Copier/Coller pour Railway

### Variables à configurer dans Railway Dashboard → api-deploy → Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:gRFzMXaGjAsvnCwCHwUAHMNSCffYFFIq@gondola.proxy.rlwy.net:20306/railway

# Cognito
AWS_COGNITO_REGION=eu-west-1
AWS_COGNITO_USER_POOL_ID=eu-west-1_szNqQAkay
AWS_COGNITO_CLIENT_ID=5f29473pmgndvnqlavstf8abnu

# S3
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=<voir .env local ou Railway>
AWS_SECRET_ACCESS_KEY=<voir .env local ou Railway>
AWS_S3_BUCKET_NAME=skyplay-assets-prod

# JWT (custom auth - Discord, email/password)
JWT_SECRET=g622Lf6UOI6HzhslTGTryOqxFvf7KPNy8H0sm5wXdLA=

# Cloudinary (chat screenshots)
CLOUDINARY_CLOUD_NAME=dxeazyhm7
CLOUDINARY_API_KEY=643428897634476
CLOUDINARY_API_SECRET=wZqKmdGIkYWIKGmcMOUZK8mbl-k

# CORS
CORS_ORIGINS=http://localhost:3000,https://sky-play-platform.vercel.app

# App
NODE_ENV=production
PORT=4000
```

---

## Variables à NE PAS mettre sur Railway (sensibles)

Ces variables sont déjà dans le code ou gérées automatiquement :
- ❌ `JWT_SECRET` - Pas utilisé (Cognito gère les tokens)
- ❌ `COGNITO_HOSTED_UI_URL` - Construit dynamiquement
- ❌ `JWKS_URI` - Construit dynamiquement depuis User Pool ID

---

## Vérification après configuration

### 1. Tester l'API
```bash
curl https://skyplayapi-production.up.railway.app/health
```
Devrait retourner : `{"status":"ok"}`

### 2. Tester Cognito
```bash
curl https://skyplayapi-production.up.railway.app/users/sync \
  -H "Authorization: Bearer <id_token>"
```
Devrait retourner les données utilisateur

### 3. Vérifier les logs
Railway Dashboard → api-deploy → Deployments → Logs
- Pas d'erreur "AWS credentials not configured"
- Pas d'erreur "DATABASE_URL not found"
- Pas d'erreur CORS

---

## Ordre de configuration recommandé

1. **DATABASE_URL** (critique - sans ça l'API ne démarre pas)
2. **AWS_COGNITO_*** (critique - sans ça le login ne fonctionne pas)
3. **CORS_ORIGINS** (important - sans ça le frontend ne peut pas appeler l'API)
4. **NODE_ENV** et **PORT** (configuration de base)
5. **AWS S3** (optionnel pour l'instant - seulement pour l'upload d'avatars)

---

## Récupération des credentials AWS S3

Si vous n'avez pas les credentials IAM :

### Option 1 : Créer un nouvel utilisateur IAM
1. AWS Console → IAM → Users → Create user
2. Nom : `skyplay-api`
3. Attach policies : Créer une policy custom :
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::skyplay/avatars/*"
    }
  ]
}
```
4. Security credentials → Create access key
5. Copier les credentials

### Option 2 : Utiliser un utilisateur existant
1. AWS Console → IAM → Users
2. Sélectionner l'utilisateur
3. Security credentials → Create access key
4. Copier les credentials

---

## Troubleshooting

### Erreur : "DATABASE_URL not found"
→ Vérifier que DATABASE_URL est bien configuré dans Railway
→ Vérifier que le service PostgreSQL est actif

### Erreur : "AWS credentials not configured"
→ Vérifier AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY
→ Vérifier que les credentials sont valides dans AWS IAM

### Erreur : "CORS policy"
→ Vérifier CORS_ORIGINS contient le domaine frontend
→ Format : pas d'espaces, séparé par virgules

### Erreur : "Invalid Cognito token"
→ Vérifier AWS_COGNITO_USER_POOL_ID
→ Vérifier AWS_COGNITO_CLIENT_ID
→ Vérifier AWS_COGNITO_REGION

---

## Fichier .env local (pour développement)

Le fichier `api-deploy/.env` contient déjà les bonnes valeurs pour le développement local.
Ne pas modifier ce fichier, il est correct.

---

## Contact et support

Si vous avez besoin des credentials AWS S3 :
- Vérifier dans AWS Console → IAM
- Ou créer un nouvel utilisateur IAM comme décrit ci-dessus

Pour DATABASE_URL :
- Railway Dashboard → PostgreSQL service → Variables → DATABASE_URL
