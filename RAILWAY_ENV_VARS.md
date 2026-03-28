# 🚨 PROBLÈME 401 sur /users/sync - Variables Railway manquantes

## ❌ Diagnostic du problème

Le code backend est **CORRECT** et utilise déjà `process.env.AWS_COGNITO_USER_POOL_ID`.

**Le problème : Railway n'a probablement PAS les variables d'environnement configurées.**

Sans ces variables, le backend ne peut pas démarrer ou utilise des valeurs par défaut incorrectes.

---

## ✅ SOLUTION : Configurer les variables dans Railway Dashboard

### Étape 1 : Accéder aux variables Railway

1. Aller sur **https://railway.app**
2. Ouvrir le projet **skyplayapi-production**
3. Cliquer sur l'onglet **"Variables"**

### Étape 2 : Ajouter/Vérifier ces variables (CRITIQUES)

**Variables Cognito - OBLIGATOIRES :**

```bash
AWS_COGNITO_REGION=eu-west-1
AWS_COGNITO_USER_POOL_ID=eu-west-1_szNqQAkay
AWS_COGNITO_CLIENT_ID=5f29473pmgndvnqlavstf8abnu
```

⚠️ **ATTENTION à la casse** : `szNqQAkay` (pas `szNqQAkey`)

**Variables Database :**

```bash
DATABASE_URL=postgresql://postgres:gRFzMXaGjAsvnCwCHwUAHMNSCffYFFIq@gondola.proxy.rlwy.net:20306/railway
```

**Variables App :**

```bash
PORT=3001
NODE_ENV=production
```

### Étape 3 : Redéployer

1. Cliquer sur **"Redeploy"** dans Railway
2. Attendre 2-3 minutes que le build se termine

### Étape 4 : Vérifier les logs Railway

Chercher ces messages dans les logs :

✅ **Message de succès attendu :**
```
Cognito JWT configured: issuer=https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_szNqQAkay audience(clientId)=5f29473pmgndvnqlavstf8abnu jwksUri=https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_szNqQAkay/.well-known/jwks.json
```

✅ **Lors d'un appel à /users/sync :**
```
[/users/sync] Authorization header (50 premiers chars): Bearer eyJ...
```

❌ **Messages d'erreur possibles si les variables sont manquantes :**
```
Missing env: AWS_COGNITO_USER_POOL_ID
Missing env: AWS_COGNITO_REGION (or AWS_REGION)
Missing env: AWS_COGNITO_CLIENT_ID
```

---

## 🔍 Vérification du code (déjà fait)

Le code backend utilise correctement les variables d'environnement :

**Fichier : `api-deploy/src/common/config/cognito.config.ts`**
```typescript
const region = process.env.AWS_COGNITO_REGION || process.env.AWS_REGION;
const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID;
const clientId = process.env.AWS_COGNITO_CLIENT_ID;

const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
const jwksUri = `${issuer}/.well-known/jwks.json`;
```

✅ Aucune valeur hardcodée avec `f1yzj1` ou `szNqQAkey`  
✅ Utilise `process.env` partout  
✅ La stratégie JWT accepte maintenant les `id_token` en plus des `access_token`

---

## 📝 Résumé

1. ✅ Code backend corrigé et déployé
2. ❌ Variables d'environnement Railway probablement manquantes
3. 🔧 **ACTION REQUISE** : Configurer les variables dans Railway Dashboard
4. 🔄 Redéployer après configuration
5. ✅ Tester le login Google
