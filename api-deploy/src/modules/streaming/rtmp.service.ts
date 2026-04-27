import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import NodeMediaServer from 'node-media-server';

/**
 * Embedded RTMP relay used for custom restreams and future match ingest
 * features. Exposing arbitrary TCP ports is not supported on most PaaS
 * providers (Railway only routes the configured HTTP port), so we launch the
 * relay best-effort and log — but never crash the app — if the ports cannot
 * be bound. The YouTube pipeline does not depend on this server being
 * reachable from the public internet.
 */
@Injectable()
export class RtmpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RtmpService.name);
  // Typed as `any` because `node-media-server` ships no native typings.
  private nms: any = null;

  onModuleInit() {
    // Opt-out switch for environments where the RTMP ports would clash.
    if (process.env.DISABLE_RTMP_SERVER === 'true') {
      this.logger.log(
        '[RTMP] Server skipped (DISABLE_RTMP_SERVER=true) — using ffmpeg relay only',
      );
      return;
    }

    const rtmpPort = Number(process.env.RTMP_PORT ?? 1935);
    const httpPort = Number(process.env.RTMP_HTTP_PORT ?? 8000);

    try {
      this.nms = new NodeMediaServer({
        rtmp: {
          port: rtmpPort,
          chunk_size: 60000,
          gop_cache: true,
          ping: 60,
          ping_timeout: 30,
        },
        http: {
          port: httpPort,
          allow_origin: '*',
        },
      });
      this.nms.run();
      this.logger.log(
        `RTMP relay listening on rtmp://0.0.0.0:${rtmpPort} (HTTP :${httpPort})`,
      );
    } catch (err) {
      this.nms = null;
      this.logger.warn(
        `RTMP relay failed to start (${(err as Error).message}) — ` +
          'streaming will still work for YouTube direct ingest.',
      );
    }
  }

  onModuleDestroy() {
    if (this.nms && typeof this.nms.stop === 'function') {
      try {
        this.nms.stop();
      } catch (err) {
        this.logger.warn(`RTMP relay stop() threw: ${(err as Error).message}`);
      }
      this.nms = null;
    }
  }
}
