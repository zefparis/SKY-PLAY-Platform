# ⚠️ Railway Storage Issue - Avatar Upload

## Problème

Les avatars uploadés ne persistent pas après redéploiement sur Railway.

**Symptôme :** La colonne `avatar` en base de données contient l'URL (`/uploads/avatars/avatar-123.jpg`) mais le fichier n'existe plus après un redéploiement.

## Cause

Railway utilise un **système de fichiers éphémère**. Tous les fichiers uploadés dans `./uploads/avatars/` sont **perdus lors du redéploiement**.

## Solution temporaire (développement)

En local, les fichiers persistent normalement dans `./uploads/avatars/`.

## Solution production recommandée

Migrer vers un service de stockage cloud persistant :

### Option 1 : Cloudinary (Recommandé - Gratuit jusqu'à 25GB)

1. Créer un compte sur [cloudinary.com](https://cloudinary.com)
2. Installer le SDK :
   ```bash
   npm install cloudinary multer-storage-cloudinary
   ```
3. Configurer dans `.env` :
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Modifier `users.controller.ts` pour utiliser Cloudinary storage au lieu de diskStorage

### Option 2 : AWS S3

1. Créer un bucket S3
2. Installer le SDK :
   ```bash
   npm install @aws-sdk/client-s3 multer-s3
   ```
3. Configurer les credentials AWS
4. Modifier le storage multer pour utiliser S3

### Option 3 : Railway Volumes (Persistant mais limité)

Railway propose des volumes persistants mais :
- Coût supplémentaire
- Limité à une seule instance (pas de scaling horizontal)
- Backup manuel nécessaire

## Logs ajoutés

Des logs détaillés ont été ajoutés dans `POST /users/avatar` pour déboguer :
- User ID
- Fichier reçu (nom, taille, type)
- URL générée
- Mise à jour DB

Vérifier les logs Railway pour confirmer que l'upload fonctionne.

## Action immédiate

Pour tester si l'upload fonctionne :
1. Uploader un avatar
2. Vérifier les logs Railway
3. Vérifier que `user.avatar` en DB contient l'URL
4. Essayer d'accéder à l'URL immédiatement (avant redéploiement)

Si l'URL fonctionne immédiatement mais pas après redéploiement → Confirme le problème de stockage éphémère.

## Prochaine étape

Implémenter Cloudinary pour le stockage persistant des avatars.
