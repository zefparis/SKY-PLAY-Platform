import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { ChildProcess, spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import type { IncomingMessage } from 'http';
import { verify } from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import type { Socket as NetSocket } from 'net';
import { URL } from 'url';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { CognitoJwtPayload } from '../../common/types/cognito-jwt-payload';

const WS_PATH = '/rtmp-ws';

/**
 * Kill-switch: when true the WebSocket relay rejects all new connections.
 * Re-enable by setting to `false` once a low-latency relay region is deployed.
 */
const RELAY_DISABLED = true;
const RELAY_DISABLED_MESSAGE =
  'Screen share relay temporarily disabled — use OBS with the RTMP key from your profile';

interface RtmpSession {
  id: string;
  ffmpeg: ChildProcess;
  ws: WebSocket;
  userId: string;
}

interface ConfigMessage {
  type: 'config';
  rtmpUrl: string;
}

/**
 * Browser → Skyplay → YouTube RTMP relay.
 *
 * Why this is *not* a `@WebSocketGateway` decorator:
 *   The application bootstraps with the Socket.IO adapter (used by
 *   `ChatGateway` for rooms / namespaces). Socket.IO refuses raw WebSocket
 *   handshakes — only its own protocol — so the browser's `new WebSocket()`
 *   call from `useScreenStream` would never succeed against a Socket.IO
 *   namespace. We therefore reach into the underlying HTTP server, attach a
 *   plain `ws.WebSocketServer` in `noServer` mode and route the `upgrade`
 *   event ourselves. This coexists peacefully with the Socket.IO listeners.
 *
 * Lifecycle:
 *   1. Client opens `wss://{api}/rtmp-ws?token={cognitoIdToken}`.
 *   2. We verify the JWT via JWKS — invalid tokens are dropped at the
 *      `upgrade` stage (before `accept`) so we never spawn ffmpeg for them.
 *   3. First text frame must be `{type:'config', rtmpUrl}`. We then spawn
 *      ffmpeg, transcoding WebM (VP8/9 + Opus) → FLV (H.264 + AAC).
 *   4. Subsequent binary frames are written to ffmpeg's stdin.
 *   5. On any disconnect (client close, ffmpeg exit, error) we tear the
 *      whole session down.
 */
@Injectable()
export class RtmpWsGateway implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RtmpWsGateway.name);
  private readonly sessions = new Map<string, RtmpSession>();
  private wss: WebSocketServer | null = null;
  private jwks: jwksRsa.JwksClient | null = null;
  private upgradeListener:
    | ((req: IncomingMessage, socket: NetSocket, head: Buffer) => void)
    | null = null;

  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const httpServer = this.adapterHost.httpAdapter?.getHttpServer?.();
    if (!httpServer) {
      this.logger.error(
        'No HTTP server available — RtmpWsGateway is disabled.',
      );
      return;
    }

    const cognito = this.config.get<{ jwksUri?: string; clientId?: string; issuer?: string }>(
      'cognito',
    );
    if (cognito?.jwksUri) {
      this.jwks = jwksRsa({
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 10 * 60 * 1000,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: cognito.jwksUri,
      });
    } else {
      this.logger.warn(
        'Cognito JWKS URI missing — RtmpWsGateway will refuse all connections.',
      );
    }

    this.wss = new WebSocketServer({ noServer: true });

    this.upgradeListener = (req, socket, head) => {
      // Only intercept our path — every other upgrade (Socket.IO etc.) must
      // bubble through the existing listeners untouched.
      const url = new URL(req.url ?? '', 'http://localhost');
      if (url.pathname !== WS_PATH) return;

      if (RELAY_DISABLED) {
        this.logger.log('Rejecting RTMP-WS upgrade: relay is disabled');
        this.rejectUpgrade(socket, RELAY_DISABLED_MESSAGE);
        return;
      }

      const token = url.searchParams.get('token');
      if (!token) {
        this.rejectUpgrade(socket, 'missing_token');
        return;
      }

      this.verifyToken(token)
        .then((userId) => {
          this.wss!.handleUpgrade(req, socket, head, (ws) => {
            this.handleConnection(ws, userId);
          });
        })
        .catch((err) => {
          this.logger.warn(
            `Upgrade rejected on ${WS_PATH}: ${(err as Error).message}`,
          );
          this.rejectUpgrade(socket, 'invalid_token');
        });
    };

    httpServer.on('upgrade', this.upgradeListener);
    this.logger.log(`RTMP WebSocket relay attached on ${WS_PATH}`);
  }

  onApplicationShutdown() {
    if (this.upgradeListener) {
      const httpServer = this.adapterHost.httpAdapter?.getHttpServer?.();
      httpServer?.off?.('upgrade', this.upgradeListener);
      this.upgradeListener = null;
    }
    for (const session of this.sessions.values()) {
      this.teardown(session);
    }
    this.sessions.clear();
    this.wss?.close();
    this.wss = null;
  }

  // ── Auth ─────────────────────────────────────────────────────────────────

  private verifyToken(token: string): Promise<string> {
    if (!this.jwks) {
      return Promise.reject(new Error('JWKS not initialised'));
    }
    const cognito = this.config.get<{ clientId?: string; issuer?: string }>('cognito');
    return new Promise((resolve, reject) => {
      verify(
        token,
        (header, callback) => {
          this.jwks!.getSigningKey(header.kid, (err, key) => {
            if (err || !key) return callback(err ?? new Error('no key'));
            callback(null, key.getPublicKey());
          });
        },
        {
          algorithms: ['RS256'],
          issuer: cognito?.issuer,
        },
        (err, decoded) => {
          if (err || !decoded || typeof decoded === 'string') {
            return reject(err ?? new Error('Invalid token'));
          }
          const payload = decoded as CognitoJwtPayload;
          // Cognito puts the user id in `sub`. We don't bind it to a specific
          // match here — the `/streaming/start` endpoint already enforced the
          // ownership check before issuing the YouTube ingest URL.
          if (!payload.sub) return reject(new Error('Token missing sub'));
          resolve(payload.sub);
        },
      );
    });
  }

  private rejectUpgrade(socket: NetSocket, reason: string): void {
    try {
      socket.write(
        `HTTP/1.1 401 Unauthorized\r\n` +
          `Connection: close\r\n` +
          `Content-Length: ${reason.length}\r\n\r\n${reason}`,
      );
    } catch {
      /* socket already gone */
    }
    socket.destroy();
  }

  // ── Session lifecycle ────────────────────────────────────────────────────

  private handleConnection(ws: WebSocket, userId: string): void {
    const sessionId = `${userId.slice(0, 6)}-${Math.random().toString(36).slice(2, 8)}`;
    let configured = false;

    const onMessage = (raw: RawData, isBinary: boolean) => {
      if (!configured && !isBinary) {
        const text = raw.toString();
        let parsed: ConfigMessage | null = null;
        try {
          parsed = JSON.parse(text) as ConfigMessage;
        } catch {
          this.logger.warn(`[${sessionId}] Invalid config JSON, closing`);
          ws.close(1003, 'invalid_config');
          return;
        }
        if (parsed?.type !== 'config' || !parsed.rtmpUrl) {
          ws.close(1003, 'invalid_config');
          return;
        }
        if (!this.isAllowedRtmp(parsed.rtmpUrl)) {
          this.logger.warn(`[${sessionId}] Rejected RTMP target ${parsed.rtmpUrl}`);
          ws.close(1008, 'target_not_allowed');
          return;
        }
        configured = true;
        const ffmpegProcess = this.spawnFfmpeg(sessionId, parsed.rtmpUrl, ws);
        if (!ffmpegProcess) {
          ws.close(1011, 'ffmpeg_failed');
          return;
        }
        this.sessions.set(sessionId, {
          id: sessionId,
          ffmpeg: ffmpegProcess,
          ws,
          userId,
        });
        this.logger.log(`[${sessionId}] relay started for user ${userId}`);
        return;
      }

      // Binary frames after configuration → pipe to ffmpeg stdin.
      const session = this.sessions.get(sessionId);
      if (!session) return;
      const stdin = session.ffmpeg.stdin;
      if (stdin && stdin.writable) {
        const buf = Buffer.isBuffer(raw)
          ? raw
          : Buffer.isBuffer((raw as Buffer[])?.[0])
            ? Buffer.concat(raw as Buffer[])
            : Buffer.from(raw as ArrayBuffer);
        if (!stdin.write(buf)) {
          // Backpressure — pause the WS until ffmpeg drains.
          ws.pause();
          stdin.once('drain', () => ws.resume());
        }
      }
    };

    ws.on('message', onMessage);

    ws.on('close', () => {
      const session = this.sessions.get(sessionId);
      if (session) {
        this.logger.log(`[${sessionId}] client disconnected`);
        this.teardown(session);
        this.sessions.delete(sessionId);
      }
    });

    ws.on('error', (err) => {
      this.logger.warn(`[${sessionId}] WS error: ${err.message}`);
    });
  }

  private spawnFfmpeg(
    sessionId: string,
    rtmpUrl: string,
    ws: WebSocket,
  ): ChildProcess | null {
    const binary =
      (typeof ffmpegStatic === 'string' && ffmpegStatic) ||
      process.env.FFMPEG_BINARY ||
      'ffmpeg';

    let proc: ChildProcess;
    try {
      proc = spawn(
        binary,
        [
          '-re',
          '-i',
          'pipe:0',
          '-c:v',
          'libx264',
          '-preset',
          'veryfast',
          '-tune',
          'zerolatency',
          '-maxrate',
          '2500k',
          '-bufsize',
          '5000k',
          '-pix_fmt',
          'yuv420p',
          '-g',
          '60',
          '-keyint_min',
          '60',
          '-sc_threshold',
          '0',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          '-ar',
          '44100',
          '-f',
          'flv',
          rtmpUrl,
        ],
        { stdio: ['pipe', 'pipe', 'pipe'] },
      );
    } catch (err) {
      this.logger.error(
        `[${sessionId}] ffmpeg spawn failed: ${(err as Error).message}`,
      );
      return null;
    }

    proc.stderr?.on('data', (chunk: Buffer) => {
      const msg = chunk.toString();
      if (/error|fatal/i.test(msg)) {
        this.logger.warn(`[${sessionId}] ffmpeg: ${msg.slice(0, 200).trim()}`);
      }
    });

    proc.on('close', (code) => {
      this.logger.log(`[${sessionId}] ffmpeg exited code=${code}`);
      const session = this.sessions.get(sessionId);
      if (session) {
        try {
          session.ws.close(1000, 'ffmpeg_exit');
        } catch {
          /* ignore */
        }
        this.sessions.delete(sessionId);
      }
    });

    proc.on('error', (err) => {
      this.logger.error(`[${sessionId}] ffmpeg error: ${err.message}`);
      try {
        ws.close(1011, 'ffmpeg_error');
      } catch {
        /* ignore */
      }
    });

    proc.stdin?.on('error', (err) => {
      // EPIPE etc. when client disconnects mid-stream — not actionable.
      this.logger.debug?.(`[${sessionId}] ffmpeg stdin error: ${err.message}`);
    });

    return proc;
  }

  private teardown(session: RtmpSession): void {
    try {
      session.ffmpeg.stdin?.end();
    } catch {
      /* ignore */
    }
    try {
      session.ffmpeg.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  }

  /**
   * Allow-list the RTMP destinations we'll relay to. YouTube's ingest is the
   * only target we currently issue, but we accept Twitch / Facebook hosts in
   * anticipation of future providers — never an arbitrary user-supplied URL.
   */
  private isAllowedRtmp(rtmpUrl: string): boolean {
    if (!/^rtmps?:\/\//i.test(rtmpUrl)) return false;
    try {
      const parsed = new URL(rtmpUrl.replace(/^rtmps?:\/\//, 'http://'));
      const host = parsed.hostname.toLowerCase();
      return (
        host.endsWith('.youtube.com') ||
        host.endsWith('.googlevideo.com') ||
        host.endsWith('.twitch.tv') ||
        host.endsWith('.contribute.live-video.net') ||
        host.endsWith('.facebook.com') ||
        host.endsWith('.fbcdn.net')
      );
    } catch {
      return false;
    }
  }
}
