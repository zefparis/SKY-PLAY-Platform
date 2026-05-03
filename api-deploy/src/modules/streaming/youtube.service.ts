import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, youtube_v3 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';

export interface YoutubeBroadcast {
  broadcastId: string;
  streamKey: string;
  streamUrl: string;
  watchUrl: string;
}

/**
 * Thin wrapper around the YouTube Data API v3 that handles the OAuth2
 * dance and the live broadcast lifecycle.
 *
 * Every mutating call creates a short-lived OAuth2 client seeded with the
 * caller's access token so this service can serve concurrent users without
 * sharing credential state.
 */
@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(private readonly config: ConfigService) {
    this.clientId = this.config.get<string>('YOUTUBE_CLIENT_ID') ?? '';
    this.clientSecret = this.config.get<string>('YOUTUBE_CLIENT_SECRET') ?? '';
    this.redirectUri = this.config.get<string>('YOUTUBE_REDIRECT_URI') ?? '';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      this.logger.warn(
        'YouTube OAuth is not fully configured — set YOUTUBE_CLIENT_ID, ' +
          'YOUTUBE_CLIENT_SECRET and YOUTUBE_REDIRECT_URI to enable streaming.',
      );
    }
  }

  /**
   * Builds a fresh OAuth2 client. Keeping it per-call avoids credential
   * cross-contamination between concurrent requests.
   */
  private buildOAuthClient(
    accessToken?: string,
    refreshToken?: string,
  ): OAuth2Client {
    const client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
    if (accessToken) {
      client.setCredentials({
        access_token: accessToken,
        ...(refreshToken ? { refresh_token: refreshToken } : {}),
      });
    }
    return client;
  }

  /**
   * Returns the Google consent URL. `userId` is echoed back via the `state`
   * query param so the callback can match the token to the right user.
   */
  getAuthUrl(userId: string): string {
    return this.buildOAuthClient().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.upload',
      ],
      state: this.signOAuthState(userId),
    });
  }

  /**
   * Exchanges the authorisation code for a token pair. The refresh token is
   * only returned the first time a user consents — callers must persist it.
   */
  async exchangeCode(
    code: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const client = this.buildOAuthClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('YouTube did not return an access_token');
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? '',
    };
  }

  /**
   * Creates a broadcast + RTMP stream on YouTube and binds them together.
   * The caller is expected to pipe OBS (or any RTMP source) to the returned
   * `streamUrl`; YouTube will auto-start the broadcast when the first frame
   * arrives (`enableAutoStart: true`).
   */
  async createLiveBroadcast(
    accessToken: string,
    title: string,
    refreshToken?: string,
  ): Promise<YoutubeBroadcast> {
    if (!accessToken) {
      throw new Error('YouTube accessToken is missing — cannot create broadcast');
    }
    this.logger.log(`createLiveBroadcast: token present=${!!accessToken}, length=${accessToken.length}`);

    const youtube = google.youtube({
      version: 'v3',
      auth: this.buildOAuthClient(accessToken, refreshToken),
    });

    const broadcast = await youtube.liveBroadcasts.insert({
      part: ['snippet', 'status', 'contentDetails'],
      requestBody: {
        snippet: {
          title,
          scheduledStartTime: new Date().toISOString(),
        },
        status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
        contentDetails: { enableAutoStart: true, enableAutoStop: true },
      },
    });

    const stream = await youtube.liveStreams.insert({
      part: ['snippet', 'cdn'],
      requestBody: {
        snippet: { title },
        cdn: {
          frameRate: 'variable',
          ingestionType: 'rtmp',
          resolution: 'variable',
        },
      },
    });

    const broadcastId = broadcast.data.id;
    const streamId = stream.data.id;

    if (!broadcastId || !streamId) {
      throw new Error('YouTube did not return broadcast/stream IDs');
    }

    await youtube.liveBroadcasts.bind({
      part: ['id'],
      id: broadcastId,
      streamId,
    });

    const ingestion: youtube_v3.Schema$IngestionInfo | undefined =
      stream.data.cdn?.ingestionInfo ?? undefined;
    const rtmpUrl = ingestion?.ingestionAddress;
    const streamKey = ingestion?.streamName;

    if (!rtmpUrl || !streamKey) {
      throw new Error('YouTube did not return ingestion RTMP details');
    }

    return {
      broadcastId,
      streamKey,
      streamUrl: `${rtmpUrl}/${streamKey}`,
      watchUrl: `https://youtube.com/watch?v=${broadcastId}`,
    };
  }

  /**
   * Transitions a broadcast to the given status ('testing' | 'live' | 'complete').
   * YouTube will reject invalid transitions with a 400 which we surface.
   */
  async transitionBroadcast(
    accessToken: string,
    broadcastId: string,
    status: 'testing' | 'live' | 'complete',
  ): Promise<void> {
    const youtube = google.youtube({
      version: 'v3',
      auth: this.buildOAuthClient(accessToken),
    });
    await youtube.liveBroadcasts.transition({
      part: ['status'],
      broadcastStatus: status,
      id: broadcastId,
    });
  }

  /**
   * Transitions a broadcast to `complete`. Idempotent from our point of view:
   * YouTube will reject redundant transitions with a 400 which we swallow.
   */
  async endBroadcast(accessToken: string, broadcastId: string): Promise<void> {
    try {
      await this.transitionBroadcast(accessToken, broadcastId, 'complete');
    } catch (err) {
      this.logger.warn(
        `endBroadcast(${broadcastId}) failed: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Returns the current lifecycle status of a broadcast.
   */
  async getBroadcastStatus(
    accessToken: string,
    broadcastId: string,
  ): Promise<{ lifeCycleStatus: string; actualStartTime?: string; actualEndTime?: string } | null> {
    const youtube = google.youtube({
      version: 'v3',
      auth: this.buildOAuthClient(accessToken),
    });
    try {
      const res = await youtube.liveBroadcasts.list({
        part: ['status', 'snippet'],
        id: [broadcastId],
      });
      const item = res.data.items?.[0];
      if (!item) return null;
      return {
        lifeCycleStatus: item.status?.lifeCycleStatus ?? 'unknown',
        actualStartTime: item.snippet?.actualStartTime ?? undefined,
        actualEndTime: item.snippet?.actualEndTime ?? undefined,
      };
    } catch (err) {
      this.logger.warn(`getBroadcastStatus(${broadcastId}) failed: ${(err as Error).message}`);
      return null;
    }
  }

  // ── OAuth state CSRF protection ────────────────────────────────────────

  /**
   * Signs a userId into an HMAC-protected state string for the OAuth2 flow.
   * Prevents CSRF attacks where an attacker could forge the state parameter
   * to link their YouTube account to a victim's Skyplay account.
   */
  signOAuthState(userId: string): string {
    const secret = this.clientSecret || 'skyplay-oauth-hmac-fallback';
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(userId)
      .digest('hex');
    return `${userId}.${hmac}`;
  }

  /**
   * Verifies and extracts the userId from an HMAC-signed state string.
   * Throws if the signature is invalid or the format is wrong.
   */
  verifyOAuthState(state: string): string {
    const dotIdx = state.lastIndexOf('.');
    if (dotIdx < 1) throw new Error('Invalid OAuth state format');
    const userId = state.substring(0, dotIdx);
    const providedHmac = state.substring(dotIdx + 1);
    const secret = this.clientSecret || 'skyplay-oauth-hmac-fallback';
    const expected = crypto
      .createHmac('sha256', secret)
      .update(userId)
      .digest('hex');
    if (
      providedHmac.length !== expected.length ||
      !crypto.timingSafeEqual(
        Buffer.from(providedHmac, 'hex'),
        Buffer.from(expected, 'hex'),
      )
    ) {
      throw new Error('Invalid OAuth state signature');
    }
    return userId;
  }

  // ── Token refresh ──────────────────────────────────────────────────────

  /**
   * Ensures the access token is still valid by attempting a refresh via the
   * OAuth2 client. Returns the (possibly new) access token and whether a
   * refresh occurred so callers can persist the updated token.
   */
  async ensureValidAccessToken(
    accessToken: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshed: boolean }> {
    if (!refreshToken) {
      this.logger.warn('ensureValidAccessToken: no refreshToken available, returning current token');
      return { accessToken, refreshed: false };
    }

    const client = this.buildOAuthClient();
    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      // Force googleapis to consider the token expired so it triggers a
      // refresh. Without expiry_date the library assumes the token is valid
      // and returns it as-is — even if it is actually expired on Google's end.
      expiry_date: 1,
    });

    try {
      const { token } = await client.getAccessToken();
      if (!token) {
        this.logger.error('ensureValidAccessToken: getAccessToken returned null after refresh attempt');
        throw new Error('YouTube token refresh returned null — re-link your YouTube account');
      }
      const refreshed = token !== accessToken;
      if (refreshed) {
        this.logger.log('ensureValidAccessToken: token was refreshed successfully');
      }
      return { accessToken: token, refreshed };
    } catch (err) {
      this.logger.error(
        `ensureValidAccessToken: refresh failed — ${(err as Error).message}`,
      );
      throw new Error(
        `YouTube token refresh failed: ${(err as Error).message}. ` +
        'The user may need to re-link their YouTube account.',
      );
    }
  }
}
