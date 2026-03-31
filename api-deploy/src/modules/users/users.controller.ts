import {
  Controller,
  Get,
  Post,
  Patch,
  Req,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { memoryStorage } from 'multer';

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
   * Protégé par JwtDualGuard (Cognito JWT ou custom JWT).
   * Upsert sur cognitoSub (idempotent).
   */
  @SkipThrottle()
  @UseGuards(JwtDualGuard)
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
  @UseGuards(JwtDualGuard)
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
  @UseGuards(JwtDualGuard)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
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

    if (!file || !file.buffer) {
      console.error('[/users/avatar] No file provided in request');
      throw new HttpException(
        'Aucun fichier fourni',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Convertir l'image en base64 pour stockage en DB
    const base64Avatar = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    
    console.log('[/users/avatar] File received:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      base64Length: base64Avatar.length,
    });
    console.log('[/users/avatar] Storing avatar as base64 in database (persistent)');

    // Mettre à jour le profil avec l'avatar en base64
    const updatedUser = await this.usersService.updateProfile(
      userPayload.id,
      { avatar: base64Avatar },
    );

    console.log('[/users/avatar] User updated successfully, avatar stored in DB (length:', base64Avatar.length, ')');

    return {
      message: 'Avatar uploadé avec succès',
      avatarUrl: base64Avatar,
      user: updatedUser,
    };
  }

  /**
   * Leaderboard public - top 100 par XP
   */
  @Get('leaderboard')
  async getLeaderboard(
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getLeaderboard(limit);
  }

  /**
   * Liste des utilisateurs en ligne (amis en premier)
   * Protégé par JwtDualGuard
   */
  @UseGuards(JwtDualGuard)
  @Get('online')
  async getOnlineUsers(
    @Req() req: Request,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const userPayload = req.user as any;
    return this.usersService.getOnlineUsers(userPayload.id, limit);
  }

  /**
   * Profil public par username
   * Public mais enrichi si authentifié (friendshipStatus)
   */
  @Get(':username')
  async getPublicProfile(
    @Param('username') username: string,
    @Req() req: Request,
  ) {
    const userPayload = req.user as any;
    const profile = await this.usersService.getPublicProfile(
      username,
      userPayload?.id,
    );

    if (!profile) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return profile;
  }

  /**
   * Récupère les statistiques de l'utilisateur connecté
   * Protégé par JwtDualGuard
   */
  @UseGuards(JwtDualGuard)
  @Get('me/stats')
  async getMyStats(@Req() req: Request) {
    const userPayload = req.user as any;
    
    if (!userPayload?.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.usersService.getUserStats(userPayload.id);
  }

  /**
   * Mise à jour du statut de l'utilisateur connecté
   * Protégé par JwtDualGuard
   */
  @UseGuards(JwtDualGuard)
  @Patch('status')
  async updateStatus(
    @Req() req: Request,
    @Body() body: { status: 'ONLINE' | 'OFFLINE' | 'IN_GAME' | 'AWAY' },
  ) {
    const userPayload = req.user as any;
    
    if (!userPayload?.id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.usersService.updateStatus(userPayload.id, body.status);
  }

  /**
   * Récupère le statut Discord d'un utilisateur
   * Public avec cache 60s
   */
  @Get(':id/discord-status')
  async getDiscordStatus(@Param('id') userId: string) {
    return this.usersService.getDiscordStatus(userId);
  }

  // ─── KYC ───────────────────────────────────────────────────────

  @SkipThrottle()
  @UseGuards(JwtDualGuard)
  @Post('kyc/submit')
  async submitKyc(@Req() req: Request, @Body() body: {
    firstName: string;
    lastName: string;
    idType: string;
    idNumber: string;
    idPhotoUrl?: string;
    selfieUrl?: string;
  }) {
    const userPayload = req.user as any;
    if (!userPayload?.id) throw new HttpException('Non authentifié', HttpStatus.UNAUTHORIZED);
    return this.usersService.submitKyc(userPayload.id, body);
  }

  @SkipThrottle()
  @UseGuards(JwtDualGuard)
  @Get('kyc/status')
  async getKycStatus(@Req() req: Request) {
    const userPayload = req.user as any;
    if (!userPayload?.id) throw new HttpException('Non authentifié', HttpStatus.UNAUTHORIZED);
    return this.usersService.getKycStatus(userPayload.id);
  }

  // ─── AUTO-EXCLUSION ────────────────────────────────────────────────────────

  @SkipThrottle()
  @UseGuards(JwtDualGuard)
  @Get('self-exclude/status')
  async getExclusionStatus(@Req() req: Request) {
    const userPayload = req.user as any;
    if (!userPayload?.id) throw new HttpException('Non authentifié', HttpStatus.UNAUTHORIZED);
    return this.usersService.getExclusionStatus(userPayload.id);
  }

  @SkipThrottle()
  @UseGuards(JwtDualGuard)
  @Post('self-exclude')
  async selfExclude(
    @Req() req: Request,
    @Body() body: { duration: string; reason?: string },
  ) {
    const userPayload = req.user as any;
    if (!userPayload?.id) throw new HttpException('Non authentifié', HttpStatus.UNAUTHORIZED);
    try {
      return await this.usersService.selfExclude(userPayload.id, body);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @SkipThrottle()
  @UseGuards(JwtDualGuard)
  @Post('self-exclude/cancel')
  async cancelExclusion(@Req() req: Request) {
    const userPayload = req.user as any;
    if (!userPayload?.id) throw new HttpException('Non authentifié', HttpStatus.UNAUTHORIZED);
    try {
      return await this.usersService.cancelExclusion(userPayload.id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}