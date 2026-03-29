import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Endpoint utilitaire: permet au frontend de valider le token et récupérer
   * le user (après user-sync).
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user);
  }

  /**
   * Discord OAuth callback
   * Échange le code Discord contre un token et crée/met à jour l'utilisateur
   */
  @Post('discord')
  async discordAuth(@Body('code') code: string) {
    return this.authService.discordAuth(code);
  }
}
