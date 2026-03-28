import {
  Controller,
  Post,
  Patch,
  Req,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { extname } from 'path';
import multerS3 from 'multer-s3';
import { diskStorage } from 'multer';
import { s3Client, getS3BucketName, isS3Configured } from '../../common/config/aws.config';

// Configuration du storage pour les avatars (S3 si configuré, sinon local)
const getStorageConfig = () => {
  if (isS3Configured() && s3Client) {
    console.log('[Avatar Storage] Using AWS S3');
    return multerS3({
      s3: s3Client,
      bucket: getS3BucketName(),
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `avatars/avatar-${uniqueSuffix}${ext}`);
      },
    });
  } else {
    console.warn('[Avatar Storage] AWS S3 not configured, using local disk storage (ephemeral on Railway)');
    return diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `avatar-${uniqueSuffix}${ext}`);
      },
    });
  }
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Public: appelé juste après userPool.signUp()
   * Crée l'utilisateur en DB sans JWT (idempotent).
   */
  // NOTE: selon la version de @nestjs/throttler, la signature peut être un objet.
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Post('register')
  async register(@Body() body: RegisterUserDto) {
    const user = await this.usersService.registerFromSignup({
      email: body.email,
      cognitoSub: body.cognitoSub,
    });
    return user;
  }

  /**
   * Synchronise l'utilisateur Cognito → PostgreSQL.
   * Protégé par JwtAuthGuard (Cognito JWT).
   * Upsert sur cognitoSub (idempotent).
   */
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('sync')
  async syncUser(@Req() req: Request) {
    // Debug: afficher le header Authorization reçu
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader && typeof authHeader === 'string') {
      console.log('[/users/sync] Authorization header (50 premiers chars):', authHeader.substring(0, 50));
    } else {
      console.log('[/users/sync] No Authorization header found');
    }
    
    // Le JwtAuthGuard valide déjà le token et place le payload dans req.user
    const userPayload = req.user as any;
    console.log('[/users/sync] req.user après JwtAuthGuard:', JSON.stringify(userPayload));
    
    if (!userPayload) {
      console.error('[/users/sync] req.user est undefined - le JwtAuthGuard a échoué');
      throw new HttpException(
        'Token Cognito invalide ou incomplet - req.user undefined',
        HttpStatus.UNAUTHORIZED,
      );
    }
    
    // JwtStrategy.validate() retourne {cognitoSub, email, username, id}
    if (!userPayload.cognitoSub) {
      console.error('[/users/sync] req.user.cognitoSub manquant:', userPayload);
      throw new HttpException(
        'Token Cognito invalide - cognitoSub manquant',
        HttpStatus.UNAUTHORIZED,
      );
    }
    
    if (!userPayload.email) {
      console.error('[/users/sync] req.user.email manquant:', userPayload);
      throw new HttpException(
        'Token Cognito invalide - email manquant',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const cognitoSub = userPayload.cognitoSub;
    const email = userPayload.email;
    const emailVerified =
      userPayload.email_verified === true || userPayload.email_verified === 'true';

    // username = partie avant @ de l'email
    const username = email.split('@')[0];

    // Upsert user (méthode à ajouter dans le service)
    const user = await this.usersService.upsertFromCognito({
      cognitoSub,
      email,
      username,
      isVerified: emailVerified,
    });

    return user;
  }

  /**
   * Met à jour le profil de l'utilisateur connecté.
   * Protégé par JwtAuthGuard.
   */
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Req() req: Request, @Body() updateDto: UpdateProfileDto) {
    const userPayload = req.user as any;
    
    if (!userPayload?.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const updatedUser = await this.usersService.updateProfile(
      userPayload.id,
      updateDto,
    );

    return updatedUser;
  }

  /**
   * Upload de la photo de profil.
   * Protégé par JwtAuthGuard.
   */
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: getStorageConfig(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new HttpException('Seules les images sont autorisées', HttpStatus.BAD_REQUEST), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
    }),
  )
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile() file: any,
  ) {
    const userPayload = req.user as any;
    console.log('[/users/avatar] Upload request from user:', userPayload?.id);

    if (!userPayload?.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!file) {
      console.error('[/users/avatar] No file provided in request');
      throw new HttpException(
        'Aucun fichier fourni',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Construire l'URL de l'avatar selon le storage utilisé
    let avatarUrl: string;
    if (isS3Configured() && file.location) {
      // S3 storage
      avatarUrl = file.location;
      console.log('[/users/avatar] File uploaded to S3:', {
        key: file.key,
        location: file.location,
        size: file.size,
      });
    } else {
      // Local disk storage
      avatarUrl = `/uploads/avatars/${file.filename}`;
      console.log('[/users/avatar] File uploaded locally (ephemeral):', {
        filename: file.filename,
        path: file.path,
        size: file.size,
      });
      console.warn('[/users/avatar] ⚠️  Using local storage - file will be lost on redeploy. Configure AWS S3 for persistence.');
    }
    console.log('[/users/avatar] Avatar URL:', avatarUrl);

    // Mettre à jour le profil avec la nouvelle URL d'avatar
    const updatedUser = await this.usersService.updateProfile(
      userPayload.id,
      { avatar: avatarUrl },
    );

    console.log('[/users/avatar] User updated successfully, avatar:', updatedUser.avatar);

    return {
      message: 'Avatar uploadé avec succès',
      avatarUrl,
      user: updatedUser,
    };
  }
}