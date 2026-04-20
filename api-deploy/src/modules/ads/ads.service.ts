import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type AdType = 'VIDEO_PRE' | 'VIDEO_POST' | 'BANNER' | 'OVERLAY' | 'POPUP' | 'NATIVE' | 'SPONSORED_EVENT';

const VIDEO_TYPES: AdType[] = ['VIDEO_PRE', 'VIDEO_POST'];

@Injectable()
export class AdsService {
  private cooldowns = new Map<string, number>(); // userId → challenges_since_last_video_ad

  constructor(private readonly prisma: PrismaService) {}

  // ─── GET AD ───────────────────────────────────────────────────────────────────

  async getAd(type: AdType, userId?: string, game?: string, country?: string) {
    // Cooldown check for video ads (1 ad per 3 challenges per user)
    if (VIDEO_TYPES.includes(type) && userId) {
      const since = this.cooldowns.get(userId) ?? 3;
      if (since < 3) {
        this.cooldowns.set(userId, since + 1);
        return null; // Cooldown active
      }
      this.cooldowns.set(userId, 1);
    }

    const now = new Date();

    // Try most specific match first, then fall back
    let ad = await this.findAd({ type, game, country, now });
    if (!ad && game) ad = await this.findAd({ type, game, country: undefined, now });
    if (!ad && country) ad = await this.findAd({ type, game: undefined, country, now });
    if (!ad) ad = await this.findAd({ type, game: undefined, country: undefined, now });

    if (!ad) return null;

    await this.prisma.advertisement.update({
      where: { id: ad.id },
      data: { impressions: { increment: 1 } },
    });

    return ad;
  }

  private async findAd(params: { type: AdType; game?: string; country?: string; now: Date }) {
    const { type, game, country, now } = params;
    return this.prisma.advertisement.findFirst({
      where: {
        type: type as any,
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
        ...(game ? { game } : { game: null }),
        ...(country ? { country } : { country: null }),
      },
    });
  }

  // ─── TRACK CLICK ──────────────────────────────────────────────────────────────

  async trackClick(adId: string, _userId: string) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id: adId } });
    if (!ad) throw new NotFoundException('Publicité introuvable');

    return this.prisma.advertisement.update({
      where: { id: adId },
      data: { clicks: { increment: 1 } },
      select: { id: true, clicks: true },
    });
  }

  // ─── CREATE AD (admin) ────────────────────────────────────────────────────────

  async createAd(dto: {
    title: string;
    type: AdType;
    mediaUrl: string;
    targetUrl?: string;
    advertiser: string;
    game?: string;
    country?: string;
    startsAt: Date;
    endsAt: Date;
  }, userRole: string) {
    if (userRole !== 'ADMIN') throw new ForbiddenException('Accès réservé aux administrateurs');

    return this.prisma.advertisement.create({
      data: {
        title: dto.title,
        type: dto.type as any,
        mediaUrl: dto.mediaUrl,
        targetUrl: dto.targetUrl ?? null,
        advertiser: dto.advertiser,
        game: dto.game ?? null,
        country: dto.country ?? null,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
      },
    });
  }

  // ─── GET STATS (admin) ────────────────────────────────────────────────────────

  async getStats(userRole: string) {
    if (userRole !== 'ADMIN') throw new ForbiddenException('Accès réservé aux administrateurs');

    const ads = await this.prisma.advertisement.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      type: ad.type,
      advertiser: ad.advertiser,
      game: ad.game,
      country: ad.country,
      isActive: ad.isActive,
      impressions: ad.impressions,
      clicks: ad.clicks,
      ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) + '%' : '0%',
      startsAt: ad.startsAt,
      endsAt: ad.endsAt,
    }));
  }
}
