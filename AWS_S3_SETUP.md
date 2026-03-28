# Configuration AWS S3 pour les avatars

## ✅ Intégration S3 implémentée

L'upload d'avatars utilise maintenant **AWS S3** au lieu du stockage local éphémère.

## Configuration requise

### 1. Variables d'environnement à configurer

Dans Railway, ajouter les variables suivantes :

```bash
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=votre_access_key
AWS_SECRET_ACCESS_KEY=votre_secret_key
AWS_S3_BUCKET_NAME=skyplay
```

### 2. Récupérer les credentials AWS

1. Aller sur AWS Console → IAM
2. Créer un utilisateur IAM pour l'application (ou utiliser existant)
3. Attacher la policy suivante :

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

4. Créer une Access Key pour cet utilisateur
5. Copier `Access Key ID` et `Secret Access Key`

### 3. Configuration du bucket S3

Le bucket **skyplay** doit avoir :

**Permissions publiques pour les objets :**
- Block all public access: **OFF** (ou configurer pour autoriser public-read sur les objets)
- ACL enabled

**CORS Configuration :**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://sky-play-platform.vercel.app",
      "https://votre-domaine.com"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

**Bucket Policy (optionnel - pour rendre tous les avatars publics) :**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::skyplay/avatars/*"
    }
  ]
}
```

### 4. Configurer Railway

1. Aller sur Railway → Projet → api-deploy
2. Variables → Add Variable
3. Ajouter les 4 variables AWS

### 5. Vérifier le déploiement

Après le redéploiement :
1. Uploader un avatar
2. Vérifier les logs Railway : `[/users/avatar] Avatar URL (S3): https://skyplay.s3.eu-west-1.amazonaws.com/avatars/avatar-123.jpg`
3. Vérifier en DB que `user.avatar` contient l'URL S3 complète
4. Tester l'accès à l'URL de l'avatar

## Fonctionnement

### Upload flow

1. Frontend envoie le fichier via FormData à `POST /users/avatar`
2. Multer-S3 intercepte le fichier
3. Upload direct vers S3 dans le dossier `avatars/`
4. S3 retourne l'URL publique : `https://skyplay.s3.eu-west-1.amazonaws.com/avatars/avatar-123.jpg`
5. Backend sauvegarde cette URL dans `user.avatar`
6. Frontend affiche l'avatar depuis l'URL S3

### Avantages vs stockage local

✅ **Persistance** : Les fichiers ne sont jamais perdus (même après redéploiement)
✅ **CDN** : S3 est distribué mondialement avec faible latence
✅ **Scalabilité** : Pas de limite de stockage
✅ **Backup** : S3 a une durabilité de 99.999999999%
✅ **Coût** : Gratuit jusqu'à 5GB (tier gratuit AWS)

## Dépendances installées

```json
{
  "@aws-sdk/client-s3": "^3.x",
  "multer-s3": "^3.x"
}
```

## Fichiers modifiés

- `api-deploy/src/common/config/aws.config.ts` - Configuration S3
- `api-deploy/src/modules/users/users.controller.ts` - Upload vers S3
- `api-deploy/.env` - Variables d'environnement

## Logs de debug

Les logs suivants sont affichés lors de l'upload :
- User ID
- Clé S3 (chemin du fichier)
- URL S3 complète
- Confirmation de mise à jour DB

## Troubleshooting

**Erreur : "AWS credentials not configured"**
→ Vérifier que les variables AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY sont définies dans Railway

**Erreur : "Access Denied"**
→ Vérifier les permissions IAM de l'utilisateur

**Erreur : "Bucket not found"**
→ Vérifier que AWS_S3_BUCKET_NAME correspond au nom du bucket

**Avatar non visible**
→ Vérifier que le bucket autorise public-read ou que la bucket policy est configurée
