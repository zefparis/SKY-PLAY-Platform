# Configuration Vercel - Variables d'environnement

## Problème actuel

Le frontend Vercel affiche "Network Error" car il essaie de contacter `http://localhost:3001` au lieu de l'API Railway de production.

## Solution : Configurer les variables d'environnement dans Vercel

### Étape 1 : Aller sur Vercel Dashboard

1. Ouvrir https://vercel.com/dashboard
2. Sélectionner le projet `sky-play-platform`
3. Aller dans **Settings** → **Environment Variables**

### Étape 2 : Ajouter les variables suivantes

**IMPORTANT : Utiliser l'URL Railway de production**

```bash
# API URL - REMPLACER localhost par l'URL Railway
NEXT_PUBLIC_API_URL=https://skyplayapi-production.up.railway.app

# AWS Cognito (identique au local)
NEXT_PUBLIC_AWS_COGNITO_REGION=eu-west-1
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID=eu-west-1_szNqQAkay
NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID=5f29473pmgndvnqlavstf8abnu
NEXT_PUBLIC_AWS_COGNITO_DOMAIN=https://eu-west-1sznqqakay.auth.eu-west-1.amazoncognito.com

# Redirections - REMPLACER localhost par le domaine Vercel
NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_IN=https://sky-play-platform.vercel.app/
NEXT_PUBLIC_AWS_COGNITO_REDIRECT_SIGN_OUT=https://sky-play-platform.vercel.app/
```

### Étape 3 : Sélectionner les environnements

Pour chaque variable, cocher :
- ✅ Production
- ✅ Preview
- ✅ Development (optionnel)

### Étape 4 : Redéployer

Après avoir ajouté les variables :
1. Aller dans **Deployments**
2. Cliquer sur le dernier déploiement
3. Cliquer sur **⋯** (trois points) → **Redeploy**
4. Attendre 1-2 minutes

## Vérification

Après le redéploiement :

1. Ouvrir https://sky-play-platform.vercel.app
2. Se connecter avec Google
3. Aller sur la page profil
4. Essayer d'uploader un avatar
5. ✅ Devrait fonctionner sans "Network Error"

## Variables actuelles (à corriger)

**❌ Actuellement (local) :**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**✅ Doit être (production) :**
```
NEXT_PUBLIC_API_URL=https://skyplayapi-production.up.railway.app
```

## Troubleshooting

**Si "Network Error" persiste :**
1. Vérifier que l'API Railway est en ligne : https://skyplayapi-production.up.railway.app/health
2. Vérifier les variables Vercel (Settings → Environment Variables)
3. Vérifier la console navigateur (F12) pour voir l'URL appelée
4. Redéployer Vercel si les variables ont été modifiées

**Si erreur CORS :**
1. Vérifier que CORS_ORIGINS dans Railway contient `https://sky-play-platform.vercel.app`
2. Redémarrer l'API Railway si nécessaire
