# Test de l'upload d'avatar - Diagnostic

## Problème actuel
L'image n'est même plus sélectionnée lors du clic sur la photo de profil.

## Checklist de diagnostic

### 1. Variables Railway configurées ✅
- [x] DATABASE_URL
- [x] AWS_COGNITO_REGION
- [x] AWS_COGNITO_USER_POOL_ID
- [x] AWS_COGNITO_CLIENT_ID
- [ ] **CORS_ORIGINS** ⚠️ CRITIQUE pour que le frontend puisse appeler l'API

### 2. Variable CORS_ORIGINS manquante ?

**Si CORS_ORIGINS n'est pas configuré dans Railway, le frontend ne peut PAS appeler l'API !**

**Ajouter dans Railway → api-deploy → Variables :**
```bash
CORS_ORIGINS=http://localhost:3000,https://sky-play-platform.vercel.app
```

Sans cette variable, toutes les requêtes du frontend vers l'API seront bloquées par le navigateur avec une erreur CORS.

### 3. Vérifier que l'API est accessible

**Test 1 : Health check**
```bash
curl https://skyplayapi-production.up.railway.app/health
```
Devrait retourner : `{"status":"ok"}`

**Test 2 : Vérifier CORS**
Ouvrir la console du navigateur (F12) et regarder s'il y a des erreurs CORS :
```
Access to fetch at 'https://skyplayapi-production.up.railway.app/users/avatar' 
from origin 'https://sky-play-platform.vercel.app' has been blocked by CORS policy
```

### 4. Vérifier les logs Railway

Railway Dashboard → api-deploy → Deployments → Logs

Chercher :
- `[Avatar Storage] Using local disk storage` (OK - fonctionne sans S3)
- `AWS S3 credentials not configured` (OK - warning attendu)
- Erreurs de démarrage
- Erreurs CORS

### 5. Test manuel de l'upload

**Avec curl (pour tester l'API directement) :**
```bash
# Remplacer <YOUR_ID_TOKEN> par votre token JWT
curl -X POST https://skyplayapi-production.up.railway.app/users/avatar \
  -H "Authorization: Bearer <YOUR_ID_TOKEN>" \
  -F "file=@/path/to/image.jpg"
```

### 6. Vérifier le frontend

**Console navigateur (F12) :**
- Regarder l'onglet Network
- Cliquer sur la photo de profil
- Sélectionner une image
- Vérifier si une requête POST vers `/users/avatar` est envoyée
- Si oui : regarder la réponse (erreur 401, 403, 500, CORS ?)
- Si non : problème dans le code frontend

**Console logs :**
- Chercher : `Upload photo: File {...}`
- Chercher : `Erreur upload photo:`
- Chercher : erreurs CORS

### 7. Problèmes courants

**Symptôme : L'image n'est pas sélectionnée**
- Vérifier que le bouton de sélection de fichier fonctionne
- Vérifier la console pour des erreurs JavaScript
- Vérifier que `handleFileChange` est bien appelé

**Symptôme : L'image est sélectionnée mais pas uploadée**
- Vérifier CORS_ORIGINS dans Railway
- Vérifier que l'API est déployée et accessible
- Vérifier le token JWT dans le localStorage

**Symptôme : Erreur 401 Unauthorized**
- Token JWT expiré ou invalide
- Se déconnecter et reconnecter

**Symptôme : Erreur CORS**
- CORS_ORIGINS manquant dans Railway
- Ajouter la variable et redéployer

## Solution immédiate

**SI CORS_ORIGINS n'est pas configuré :**

1. Railway Dashboard → api-deploy → Variables
2. Ajouter :
   ```
   CORS_ORIGINS=http://localhost:3000,https://sky-play-platform.vercel.app
   ```
3. Attendre le redéploiement (2-3 minutes)
4. Réessayer l'upload

**SI l'API ne démarre pas :**

Vérifier les logs Railway pour voir l'erreur exacte.

## Variables Railway complètes (rappel)

```bash
# CRITIQUE
DATABASE_URL=postgresql://postgres:gRFzMXaGjAsvnCwCHwUAHMNSCffYFFIq@gondola.proxy.rlwy.net:20306/railway
AWS_COGNITO_REGION=eu-west-1
AWS_COGNITO_USER_POOL_ID=eu-west-1_szNqQAkay
AWS_COGNITO_CLIENT_ID=5f29473pmgndvnqlavstf8abnu
CORS_ORIGINS=http://localhost:3000,https://sky-play-platform.vercel.app

# IMPORTANT
NODE_ENV=production
PORT=4000

# OPTIONNEL (pour S3)
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=<votre_access_key>
AWS_SECRET_ACCESS_KEY=<votre_secret_key>
AWS_S3_BUCKET_NAME=skyplay
```
