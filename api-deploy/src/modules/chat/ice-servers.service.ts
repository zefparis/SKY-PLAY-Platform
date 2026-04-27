import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Serves ICE servers (STUN + TURN) to WebRTC peers.
 *
 * Priority:
 *  1. Twilio Network Traversal Service (temporary credentials, 24h TTL)
 *  2. OpenRelay public TURN (fallback, unreliable in prod)
 *  3. Google public STUN (last resort — works only if no strict NAT)
 *
 * Credentials must be fetched from the API on each call — never hardcoded
 * in the frontend, since Twilio tokens expire.
 */
@Injectable()
export class IceServersService {
  private readonly logger = new Logger(IceServersService.name);

  constructor(private config: ConfigService) {}

  async getIceServers(): Promise<RTCIceServer[]> {
    const accountSid =
      this.config.get<string>('TWILIO_ACCOUNT_SID') ||
      process.env.TWILIO_ACCOUNT_SID;
    const authToken =
      this.config.get<string>('TWILIO_AUTH_TOKEN') ||
      process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      try {
        // Dynamic require so the service boots even if `twilio` is not installed.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const twilio = require('twilio');
        const client = twilio(accountSid, authToken);
        const token = await client.tokens.create();
        if (Array.isArray(token?.iceServers) && token.iceServers.length > 0) {
          return token.iceServers as RTCIceServer[];
        }
        this.logger.warn('Twilio returned empty iceServers — using fallback');
      } catch (err: any) {
        this.logger.warn(
          `Twilio ICE fetch failed, using fallback: ${err?.message ?? err}`,
        );
      }
    }

    return this.openRelayFallback();
  }

  private openRelayFallback(): RTCIceServer[] {
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ];
  }
}
