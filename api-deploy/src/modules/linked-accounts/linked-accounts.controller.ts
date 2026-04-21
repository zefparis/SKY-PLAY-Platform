import {
  Controller,
  Get,
  Delete,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { GameProvider } from '@prisma/client';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import { LinkedAccountsService } from './linked-accounts.service';

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
    @Req() req: Request,
    @Param('provider') provider: string,
  ): Promise<void> {
    const userId = (req as any).user?.id;
    const normalizedProvider = provider.toUpperCase() as GameProvider;
    await this.linkedAccountsService.unlink(userId, normalizedProvider);
  }
}
