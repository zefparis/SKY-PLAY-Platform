import {
  Controller,
  Get,
  Delete,
  Param,
  Req,
  Request,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { GameProvider } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LinkedAccountsService } from './linked-accounts.service';
import { SteamService } from './steam.service';
import { EpicService } from './epic.service';

@Controller('users/me/linked-accounts')
@UseGuards(JwtDualGuard)
export class LinkedAccountsController {
  constructor(private readonly linkedAccountsService: LinkedAccountsService) {}


  /**
   * GET /users/me/linked-accounts
   * Returns all linked gaming accounts for the authenticated user (tokens masked).
   */
  @Get()
  async getLinkedAccounts(@Req() req: Request) {
    const userId = (req as any).user?.id;
    return this.linkedAccountsService.findByUser(userId);
  }

  /**
   * DELETE /users/me/linked-accounts/:provider
   * Unlinks a gaming account (STEAM, EPIC, DISCORD, TWITCH).
   */
  @Delete(':provider')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlinkAccount(
    @Req() req: any,
    @Param('provider') provider: string,
  ): Promise<void> {
    const userId = req.user?.id;
    const normalizedProvider = provider.toUpperCase() as GameProvider;
    await this.linkedAccountsService.unlink(userId, normalizedProvider);
  }
}

@Controller('auth')
export class LinkedAccountsOAuthController {
  private readonly frontendUrl: string;

  constructor(
    private readonly steamService: SteamService,
    private readonly epicService: EpicService,
    private readonly linkedAccountsService: LinkedAccountsService,
    private readonly config: ConfigService,
  ) {
    this.frontendUrl = config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  }

  // ── STEAM ──

  @Get('steam/connect')
  @UseGuards(JwtAuthGuard)
  async steamConnect(@Request() req: any) {
    const url = this.steamService.getAuthUrl(req.user.id);
    return { url };
  }

  @Get('steam/callback')
  async steamCallback(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    const { userId } = query;
    const steamId = await this.steamService.verifyCallback(query);
    if (!steamId) {
      return res.redirect(`${this.frontendUrl}/profile?steam=error`);
    }
    const profile = await this.steamService.getSteamProfile(steamId);
    await this.linkedAccountsService.linkSteam(userId, steamId, profile);
    return res.redirect(`${this.frontendUrl}/profile?steam=linked`);
  }

  // ── EPIC ──

  @Get('epic/connect')
  @UseGuards(JwtAuthGuard)
  async epicConnect(@Request() req: any) {
    const url = this.epicService.getAuthUrl(req.user.id);
    return { url };
  }

  @Get('epic/callback')
  async epicCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    const tokens = await this.epicService.exchangeCode(code);
    const profile = await this.epicService.getEpicProfile(tokens.accessToken);
    await this.linkedAccountsService.linkEpic(
      userId,
      profile.epicId,
      tokens.accessToken,
      tokens.refreshToken,
      profile.username,
    );
    return res.redirect(`${this.frontendUrl}/profile?epic=linked`);
  }
}
