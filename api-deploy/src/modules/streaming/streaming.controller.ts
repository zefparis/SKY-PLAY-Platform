import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GameProvider } from '@prisma/client';
import type { Request } from 'express';
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
 * The callback route is JWT-guarded — the frontend page at
 * `/auth/youtube/callback` receives Google's redirect, then calls
 * this endpoint with the user's Bearer token from localStorage.
 * HMAC-signed state is still verified for CSRF protection.
 */
@Controller()
export class StreamingController {
  private readonly logger = new Logger(StreamingController.name);

  constructor(
    private readonly youtube: YoutubeService,
    private readonly linkedAccounts: LinkedAccountsService,
    private readonly prisma: PrismaService,
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
  @UseGuards(JwtAuthGuard)
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() req: Request,
  ) {
    const jwtUserId = (req as any).user?.id;
    if (!jwtUserId) throw new BadRequestException('Missing user id');

    if (error) {
      this.logger.warn(`YouTube OAuth denied: ${error}`);
      throw new BadRequestException({ reason: 'access_denied', message: `OAuth denied: ${error}` });
    }
    if (!code || !state) {
      throw new BadRequestException({ reason: 'missing_params', message: 'Missing code or state' });
    }

    // Verify HMAC-signed state for CSRF protection
    let stateUserId: string;
    try {
      stateUserId = this.youtube.verifyOAuthState(state);
    } catch {
      this.logger.warn('YouTube OAuth: invalid state signature');
      throw new ForbiddenException({ reason: 'invalid_state', message: 'Invalid OAuth state' });
    }

    // Cross-check: JWT user must match the user who initiated the OAuth flow
    if (stateUserId !== jwtUserId) {
      this.logger.warn(`YouTube OAuth: state userId ${stateUserId} ≠ JWT userId ${jwtUserId}`);
      throw new ForbiddenException({ reason: 'user_mismatch', message: 'OAuth state does not match authenticated user' });
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
        this.logger.warn(`YouTube OAuth: no channel found for user ${jwtUserId}`);
        throw new BadRequestException({ reason: 'no_channel', message: 'No YouTube channel found' });
      }

      await this.linkedAccounts.linkYoutube(
        jwtUserId,
        channelId,
        accessToken,
        refreshToken,
        channelTitle,
      );

      return { success: true, channelId, channelName: channelTitle ?? null };
    } catch (err) {
      // Re-throw NestJS HTTP exceptions as-is
      if (err instanceof BadRequestException || err instanceof ForbiddenException) throw err;
      this.logger.error(
        `YouTube OAuth callback failed: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw new BadRequestException({ reason: 'exchange_failed', message: 'YouTube token exchange failed' });
    }
  }

  // ─── Streaming lifecycle ───────────────────────────────────────────────

  @Post('streaming/start')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
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

    const accessToken = await this.getValidYoutubeToken(userId);

    const match = await this.findStreamableMatch(body.matchId);
    if (!match) {
      throw new NotFoundException(`Match ${body.matchId} introuvable`);
    }

    this.assertOwnership(match, userId);

    if (match.broadcastId) {
      throw new BadRequestException(
        'Une diffusion est déjà en cours pour ce match — arrêtez-la avant d\'en démarrer une nouvelle',
      );
    }

    const title =
      body.title?.trim() ||
      `SkyPlay — Match ${body.matchId.slice(0, 8)}`;

    const broadcast = await this.youtube.createLiveBroadcast(
      accessToken,
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
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async stop(
    @Req() req: Request,
    @Body() body: StopStreamingBody,
  ): Promise<{ ended: boolean }> {
    const userId = (req as any).user?.id;
    if (!userId) throw new BadRequestException('Missing user id');
    if (!body?.matchId) throw new BadRequestException('matchId is required');

    const accessToken = await this.getValidYoutubeToken(userId);

    const match = await this.findStreamableMatch(body.matchId);
    if (!match) {
      throw new NotFoundException(`Match ${body.matchId} introuvable`);
    }
    this.assertOwnership(match, userId);

    if (!match.broadcastId) {
      throw new BadRequestException('Aucune diffusion en cours pour ce match');
    }

    await this.youtube.endBroadcast(accessToken, match.broadcastId);

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
    | { kind: 'match' | 'tournamentMatch'; id: string; broadcastId: string | null; playerIds: string[] }
    | null
  > {
    const tournamentMatch = await this.prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { id: true, broadcastId: true, player1Id: true, player2Id: true },
    });
    if (tournamentMatch) {
      return {
        kind: 'tournamentMatch',
        id: tournamentMatch.id,
        broadcastId: tournamentMatch.broadcastId,
        playerIds: [tournamentMatch.player1Id, tournamentMatch.player2Id],
      };
    }

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, broadcastId: true, results: { select: { userId: true } } },
    });
    if (match) {
      return {
        kind: 'match',
        id: match.id,
        broadcastId: match.broadcastId,
        playerIds: match.results.map((r) => r.userId),
      };
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
          streamUrl: broadcast.watchUrl,
          streamType: 'YOUTUBE',
        },
      });
    }
  }

  private async clearBroadcast(
    kind: 'match' | 'tournamentMatch',
    id: string,
  ): Promise<void> {
    const resetData = { broadcastId: null, streamKey: null, streamUrl: null, streamType: null };
    if (kind === 'tournamentMatch') {
      await this.prisma.tournamentMatch.update({
        where: { id },
        data: resetData,
      });
    } else {
      await this.prisma.match.update({
        where: { id },
        data: resetData,
      });
    }
  }

  // ── Token & ownership helpers ───────────────────────────────────────────

  /**
   * Retrieves a valid YouTube access token for the user, refreshing it via
   * OAuth2 if it has expired. Persists the refreshed token back to the DB.
   */
  private async getValidYoutubeToken(userId: string): Promise<string> {
    const tokens = await this.linkedAccounts.getDecryptedTokens(
      userId,
      GameProvider.YOUTUBE,
    );
    if (!tokens?.accessToken) {
      throw new NotFoundException(
        'Aucun compte YouTube lié — connectez-vous via /auth/youtube/connect',
      );
    }

    const { accessToken, refreshed } = await this.youtube.ensureValidAccessToken(
      tokens.accessToken,
      tokens.refreshToken,
    );
    if (refreshed) {
      await this.linkedAccounts.updateEncryptedAccessToken(
        userId,
        GameProvider.YOUTUBE,
        accessToken,
      );
      this.logger.log(`Refreshed YouTube token for user ${userId.slice(0, 8)}…`);
    }
    return accessToken;
  }

  /**
   * Verifies that the authenticated user is a participant in the match.
   * Legacy `Match` records without participant data are allowed through
   * to preserve backwards compatibility.
   */
  private assertOwnership(
    match: { playerIds: string[] },
    userId: string,
  ): void {
    if (match.playerIds.length === 0) return;
    if (!match.playerIds.includes(userId)) {
      throw new ForbiddenException(
        'Vous ne participez pas à ce match',
      );
    }
  }
}
