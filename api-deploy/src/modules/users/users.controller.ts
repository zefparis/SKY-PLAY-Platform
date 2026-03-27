import {
  Controller,
  Post,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Synchronise l'utilisateur Cognito → PostgreSQL.
   * Protégé par JwtAuthGuard (Cognito JWT).
   * Upsert sur cognitoSub (idempotent).
   */
  @Post('sync')
  async syncUser(@Req() req: Request) {
    // Le JwtAuthGuard valide déjà le token et place le payload dans req.user
    const userPayload = req.user as any;
    if (!userPayload || !userPayload.sub || !userPayload.email) {
      throw new HttpException(
        'Token Cognito invalide ou incomplet',
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