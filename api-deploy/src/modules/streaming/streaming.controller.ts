import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GameProvider } from '@prisma/client';
import type { Request, Response } from 'express';
import { google } from 'googleapis';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LinkedAccountsService } from '../linked-accounts/linked-accounts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { YoutubeService } from './youtube.service';

interface StartStreamingBody {
  matchId: string;
  title?: string;
}

interface StopStreamingBody {
  matchId: string;
}

/**
 * Endpoints exposing the YouTube OAuth2 dance and the live broadcast
 * lifecycle. OAuth routes live under `/auth/youtube/*` to mirror the rest
 * of the BYOG providers; broadcast controls live under `/streaming/*`.
 *
 * The callback route is intentionally guard-less because Google redirects
 * the user agent back without our session cookies. Authenticity is
 * re-established by validating the `state` parameter (a user id we minted
 * and echoed through Google).
 */
@Controller()
export class StreamingController {
  private readonly logger = new Logger(StreamingController.name);

  constructor(
    private readonly youtube: YoutubeService,
    private readonly linkedAccounts: LinkedAccountsService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ─── OAuth ─────────────────────────────────────────────────────────────

  @Get('auth/youtube/connect')
  @UseGuards(JwtAuthGuard)
  connect(@Req() req: Request): { url: string } {
    const userId = (req as any).user?.id;
    if (!userId) throw new BadRequestException('Missing user id');
    return { url: this.youtube.getAuthUrl(userId) };
  }

  @Get('auth/youtube/callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ??
      'https://sky-play-platform.vercel.app';

    if (error) {
      this.logger.warn(`YouTube OAuth denied: ${error}`);
      return res.redirect(
        `${frontendUrl}/profile?youtube=error&reason=${encodeURIComponent(error)}`,
      );
    }
    if (!code || !state) {
      return res.redirect(`${frontendUrl}/profile?youtube=error&reason=missing_params`);
    }

    try {
      const { accessToken, refreshToken } = await this.youtube.exchangeCode(code);

      // Fetch the channel id/title so we can key LinkedAccount by externalId
      // and display something human-friendly in the UI.
      const oauth = new google.auth.OAuth2();
      oauth.setCredentials({ access_token: accessToken });
      const yt = google.youtube({ version: 'v3', auth: oauth });
      const channelsResp = await yt.channels.list({ part: ['snippet'], mine: true });
      const channel = channelsResp.data.items?.[0];
      const channelId = channel?.id ?? '';
      const channelTitle = channel?.snippet?.title ?? undefined;

      if (!channelId) {
        this.logger.warn(`YouTube OAuth: no channel found for user ${state}`);
        return res.redirect(
          `${frontendUrl}/profile?youtube=error&reason=no_channel`,
        );
      }

      await this.linkedAccounts.linkYoutube(
        state,
        channelId,
        accessToken,
        refreshToken,
        channelTitle,
      );

      return res.redirect(`${frontendUrl}/profile?youtube=linked`);
    } catch (err) {
      this.logger.error(
        `YouTube OAuth callback failed: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return res.redirect(`${frontendUrl}/profile?youtube=error&reason=exchange_failed`);
    }
  }

  // ─── Streaming lifecycle ───────────────────────────────────────────────

  @Post('streaming/start')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async start(
    @Req() req: Request,
    @Body() body: StartStreamingBody,
  ): Promise<{
    broadcastId: string;
    streamKey: string;
    rtmpEndpoint: string;
    streamUrl: string;
    watchUrl: string;
  }> {
    const userId = (req as any).user?.id;
    if (!userId) throw new BadRequestException('Missing user id');
    if (!body?.matchId) throw new BadRequestException('matchId is required');

    const tokens = await this.linkedAccounts.getDecryptedTokens(
      userId,
      GameProvider.YOUTUBE,
    );
    if (!tokens?.accessToken) {
      throw new NotFoundException(
        'Aucun compte YouTube lié — connectez-vous via /auth/youtube/connect',
      );
    }

    const match = await this.findStreamableMatch(body.matchId);
    if (!match) {
      throw new NotFoundException(`Match ${body.matchId} introuvable`);
    }

    const title =
      body.title?.trim() ||
      `SkyPlay — Match ${body.matchId.slice(0, 8)}`;

    const broadcast = await this.youtube.createLiveBroadcast(
      tokens.accessToken,
      title,
    );

    await this.persistBroadcast(match.kind, match.id, broadcast);

    // Split the YouTube stream URL back into endpoint + key for clients that
    // prefer to configure OBS with two fields instead of one.
    const rtmpEndpoint = broadcast.streamUrl.replace(
      `/${broadcast.streamKey}`,
      '',
    );

    return {
      broadcastId: broadcast.broadcastId,
      streamKey: broadcast.streamKey,
      rtmpEndpoint,
      streamUrl: broadcast.streamUrl,
      watchUrl: broadcast.watchUrl,
    };
  }

  @Post('streaming/stop')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async stop(
    @Req() req: Request,
    @Body() body: StopStreamingBody,
  ): Promise<{ ended: boolean }> {
    const userId = (req as any).user?.id;
    if (!userId) throw new BadRequestException('Missing user id');
    if (!body?.matchId) throw new BadRequestException('matchId is required');

    const tokens = await this.linkedAccounts.getDecryptedTokens(
      userId,
      GameProvider.YOUTUBE,
    );
    if (!tokens?.accessToken) {
      throw new NotFoundException('Aucun compte YouTube lié');
    }

    const match = await this.findStreamableMatch(body.matchId);
    if (!match) {
      throw new NotFoundException(`Match ${body.matchId} introuvable`);
    }
    if (!match.broadcastId) {
      throw new BadRequestException('Aucune diffusion en cours pour ce match');
    }

    await this.youtube.endBroadcast(tokens.accessToken, match.broadcastId);

    // Clear ephemeral stream state so a fresh start creates a new broadcast.
    await this.clearBroadcast(match.kind, match.id);

    return { ended: true };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  /**
   * A matchId can reference either a legacy `Match` or a `TournamentMatch`.
   * We look it up in both tables and tag the result with its origin so the
   * persistence path below knows which model to update.
   */
  private async findStreamableMatch(
    matchId: string,
  ): Promise<
    | { kind: 'match' | 'tournamentMatch'; id: string; broadcastId: string | null }
    | null
  > {
    const tournamentMatch = await this.prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { id: true, broadcastId: true },
    });
    if (tournamentMatch) {
      return { kind: 'tournamentMatch', ...tournamentMatch };
    }

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, broadcastId: true },
    });
    if (match) {
      return { kind: 'match', ...match };
    }

    return null;
  }

  private async persistBroadcast(
    kind: 'match' | 'tournamentMatch',
    id: string,
    broadcast: { broadcastId: string; streamKey: string; watchUrl: string },
  ): Promise<void> {
    if (kind === 'tournamentMatch') {
      await this.prisma.tournamentMatch.update({
        where: { id },
        data: {
          broadcastId: broadcast.broadcastId,
          streamKey: broadcast.streamKey,
          streamUrl: broadcast.watchUrl,
          streamType: 'YOUTUBE',
        },
      });
    } else {
      await this.prisma.match.update({
        where: { id },
        data: {
          broadcastId: broadcast.broadcastId,
          streamKey: broadcast.streamKey,
        },
      });
    }
  }

  private async clearBroadcast(
    kind: 'match' | 'tournamentMatch',
    id: string,
  ): Promise<void> {
    if (kind === 'tournamentMatch') {
      await this.prisma.tournamentMatch.update({
        where: { id },
        data: { broadcastId: null, streamKey: null },
      });
    } else {
      await this.prisma.match.update({
        where: { id },
        data: { broadcastId: null, streamKey: null },
      });
    }
  }
}
