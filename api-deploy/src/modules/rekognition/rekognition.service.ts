import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RekognitionClient,
  DetectTextCommand,
  DetectLabelsCommand,
  TextDetection,
  Label,
} from '@aws-sdk/client-rekognition';

export type ParsedResult = {
  verifiedRank: number | null;
  verifiedScore: number | null;
  confidence: number;
};

export type AnalysisResult = ParsedResult & {
  rawData: any;
  status: 'ANALYZED' | 'LOW_CONFIDENCE' | 'FAILED';
};

const MIN_CONFIDENCE = 70;

@Injectable()
export class RekognitionService {
  private readonly logger = new Logger(RekognitionService.name);
  private readonly client: RekognitionClient;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const region = this.config.get<string>('AWS_REGION') ?? 'eu-west-1';
    // Support both naming conventions used across the codebase
    this.bucket =
      this.config.get<string>('AWS_S3_BUCKET') ??
      this.config.get<string>('AWS_S3_BUCKET_NAME') ??
      'skyplay-assets-prod';

    this.client = new RekognitionClient({
      region,
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY') ?? '',
      },
    });

    this.logger.log(`RekognitionService ready (region=${region}, bucket=${this.bucket})`);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Extract the S3 key from a public S3 URL.
   * Example: https://bucket.s3.eu-west-1.amazonaws.com/skyplay/screenshots/uuid.jpg
   *   → skyplay/screenshots/uuid.jpg
   */
  extractS3Key(screenshotUrl: string): string {
    const url = new URL(screenshotUrl);
    return decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  }

  // ─── AWS Rekognition primitives ───────────────────────────────────────────

  async detectText(s3Key: string): Promise<TextDetection[]> {
    const command = new DetectTextCommand({
      Image: { S3Object: { Bucket: this.bucket, Name: s3Key } },
    });
    const response = await this.client.send(command);
    return response.TextDetections ?? [];
  }

  async detectLabels(s3Key: string): Promise<Label[]> {
    const command = new DetectLabelsCommand({
      Image: { S3Object: { Bucket: this.bucket, Name: s3Key } },
      MaxLabels: 20,
      MinConfidence: 70,
    });
    const response = await this.client.send(command);
    return response.Labels ?? [];
  }

  // ─── Public entry point ───────────────────────────────────────────────────

  async analyzeScreenshot(s3Key: string, game: string): Promise<AnalysisResult> {
    try {
      const [textDetections, labels] = await Promise.all([
        this.detectText(s3Key),
        this.detectLabels(s3Key),
      ]);

      const rawData = { textDetections, labels };
      const parsed = this.parseByGame(game, textDetections);

      if (!parsed || parsed.confidence < MIN_CONFIDENCE) {
        this.logger.warn(
          `Low/no confidence for game=${game} key=${s3Key} (${parsed?.confidence ?? 0})`,
        );
        return {
          verifiedRank: null,
          verifiedScore: null,
          confidence: parsed?.confidence ?? 0,
          rawData,
          status: 'LOW_CONFIDENCE',
        };
      }

      this.logger.log(
        `Analyzed key=${s3Key} game=${game} → rank=${parsed.verifiedRank} score=${parsed.verifiedScore} conf=${parsed.confidence}`,
      );
      return { ...parsed, rawData, status: 'ANALYZED' };
    } catch (err: any) {
      this.logger.error(`Rekognition failure for key=${s3Key}: ${err?.message}`);
      return {
        verifiedRank: null,
        verifiedScore: null,
        confidence: 0,
        rawData: { error: err?.message ?? 'unknown error' },
        status: 'FAILED',
      };
    }
  }

  // ─── Game routing ─────────────────────────────────────────────────────────

  private parseByGame(game: string, detections: TextDetection[]): ParsedResult | null {
    const texts = detections
      .filter((d) => d.Type === 'LINE')
      .map((d) => ({
        text: d.DetectedText ?? '',
        confidence: d.Confidence ?? 0,
      }));

    const gameKey = (game ?? '').toLowerCase();

    if (gameKey.includes('fifa') || gameKey.includes('efootball') || gameKey.includes('ea sports')) {
      return this.parseFifa(texts);
    }
    if (gameKey.includes('cod') || gameKey.includes('call of duty') || gameKey.includes('warzone')) {
      return this.parseCOD(texts);
    }
    if (gameKey.includes('mortal') || gameKey.includes('street fighter') || gameKey.includes('tekken')) {
      return this.parseFighting(texts);
    }
    return null;
  }

  // ─── Per-game parsers ─────────────────────────────────────────────────────

  private parseFifa(texts: { text: string; confidence: number }[]): ParsedResult {
    // Look for "N - M" patterns (final score line)
    for (const { text, confidence } of texts) {
      const m = text.match(/(\d+)\s*[-–]\s*(\d+)/);
      if (m) {
        const a = parseInt(m[1], 10);
        const b = parseInt(m[2], 10);
        const winner = a > b ? 1 : a < b ? 2 : 0;
        return {
          verifiedRank: winner === 0 ? null : winner,
          verifiedScore: Math.max(a, b),
          confidence,
        };
      }
    }
    return { verifiedRank: null, verifiedScore: null, confidence: 0 };
  }

  private parseCOD(texts: { text: string; confidence: number }[]): ParsedResult {
    // Placement: "#N", "Place: N", "Rank N"
    for (const { text, confidence } of texts) {
      const m = text.match(/#(\d+)|[Pp]lace[:\s]+(\d+)|[Rr]ank[:\s]+(\d+)/);
      if (m) {
        const rank = parseInt(m[1] || m[2] || m[3], 10);
        return { verifiedRank: rank, verifiedScore: null, confidence };
      }
    }
    // Fallback: kills count
    for (const { text, confidence } of texts) {
      const m = text.match(/(\d+)\s*[Kk]ill/);
      if (m) {
        return { verifiedRank: null, verifiedScore: parseInt(m[1], 10), confidence };
      }
    }
    return { verifiedRank: null, verifiedScore: null, confidence: 0 };
  }

  private parseFighting(texts: { text: string; confidence: number }[]): ParsedResult {
    for (const { text, confidence } of texts) {
      if (/player\s*1\s*wins/i.test(text)) {
        return { verifiedRank: 1, verifiedScore: null, confidence };
      }
      if (/player\s*2\s*wins/i.test(text)) {
        return { verifiedRank: 2, verifiedScore: null, confidence };
      }
    }
    return { verifiedRank: null, verifiedScore: null, confidence: 0 };
  }
}
