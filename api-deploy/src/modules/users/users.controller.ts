import {
  Controller,
  Post,
  Req,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';

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
    
    if (!userPayload.sub) {
      console.error('[/users/sync] req.user.sub manquant:', userPayload);
      throw new HttpException(
        'Token Cognito invalide - sub manquant',
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

    const cognitoSub = userPayload.sub;
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
}