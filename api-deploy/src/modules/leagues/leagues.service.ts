import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_ORDER = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'LEGEND', 'GLORY'] as const;
type Tier = (typeof TIER_ORDER)[number];

const XP_TIER_MAP: { tier: Tier; min: number }[] = [
  { tier: 'GLORY',   min: 80000 },
  { tier: 'LEGEND',  min: 60000 },
  { tier: 'DIAMOND', min: 40000 },
  { tier: 'GOLD',    min: 25000 },
  { tier: 'SILVER',  min: 10000 },
  { tier: 'BRONZE',  min: 0 },
];

const SEASON_PROMOTION_THRESHOLDS: Record<Tier, number> = {
  BRONZE:  500,
  SILVER:  750,
  GOLD:    1000,
  DIAMOND: 1250,
  LEGEND:  1500,
  GLORY:   Infinity,
};

export const TIER_DEFINITIONS: Record<Tier, { xpRequired: number; pointsToPromote: number | null; color: string }> = {
  BRONZE:  { xpRequired: 0,     pointsToPromote: 500,  color: '#CD7F32' },
  SILVER:  { xpRequired: 10000, pointsToPromote: 750,  color: '#C0C0C0' },
  GOLD:    { xpRequired: 25000, pointsToPromote: 1000, color: '#FFD700' },
  DIAMOND: { xpRequired: 40000, pointsToPromote: 1250, color: '#B9F2FF' },
  LEGEND:  { xpRequired: 60000, pointsToPromote: 1500, color: '#FF6B6B' },
  GLORY:   { xpRequired: 80000, pointsToPromote: null, color: '#9B59B6' },
};

// ─── Season helpers ───────────────────────────────────────────────────────────

function currentSeason(): number {
  const d = new Date();
  return d.getFullYear() * 100 + (d.getMonth() + 1);
}

function prevSeason(): number {
  const d = new Date();
  const m = d.getMonth(); // 0-indexed
  return m === 0
    ? (d.getFullYear() - 1) * 100 + 12
    : d.getFullYear() * 100 + m;
}

function seasonRange(season: number): { startsAt: Date; endsAt: Date } {
  const year = Math.floor(season / 100);
  const month = season % 100;
  const startsAt = new Date(year, month - 1, 1);
  const endsAt = new Date(year, month, 0, 23, 59, 59, 999); // last day of month
  return { startsAt, endsAt };
}

function xpToTier(xp: number): Tier {
  for (const { tier, min } of XP_TIER_MAP) {
    if (xp >= min) return tier;
  }
  return 'BRONZE';
}

function nextTier(tier: Tier): Tier {
  const idx = TIER_ORDER.indexOf(tier);
  return idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : tier;
}

function prevTierOf(tier: Tier): Tier {
  const idx = TIER_ORDER.indexOf(tier);
  return idx > 0 ? TIER_ORDER[idx - 1] : tier;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class LeaguesService {
  private readonly logger = new Logger(LeaguesService.name);
  private server: any = null;

  constructor(private readonly prisma: PrismaService) {}

  setServer(server: any) {
    this.server = server;
  }

  private emitToUser(userId: string, event: string, data: any) {
    this.server?.to(`user_${userId}`).emit(event, data);
  }

  // ─── GET OR CREATE LEAGUE ────────────────────────────────────────────────────

  async getOrCreateLeague(tier: Tier, game: string, season: number) {
    const existing = await (this.prisma as any).league.findFirst({
      where: { tier, game, season },
    });
    if (existing) return existing;

    const { startsAt, endsAt } = seasonRange(season);
    return (this.prisma as any).league.create({
      data: { tier, game, season, startsAt, endsAt },
    });
  }

  // ─── ASSIGN PLAYER TO LEAGUE ─────────────────────────────────────────────────

  async assignPlayerToLeague(userId: string, game: string) {
    const season = currentSeason();
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
    if (!user) return null;

    const tier = xpToTier(user.xp);
    const league = await this.getOrCreateLeague(tier, game, season);

    const existing = await (this.prisma as any).leagueEntry.findUnique({
      where: { leagueId_userId: { leagueId: league.id, userId } },
    });
    if (existing) return existing;

    return (this.prisma as any).leagueEntry.create({
      data: { leagueId: league.id, userId },
      include: { league: true },
    });
  }

  // ─── AWARD LEAGUE POINTS ─────────────────────────────────────────────────────

  async awardLeaguePoints(userId: string, game: string, points: number) {
    const season = currentSeason();

    // Find current entry or auto-assign
    const entry = await this.findCurrentEntry(userId, game, season)
      ?? await this.assignPlayerToLeague(userId, game);

    if (!entry) return;

    const updated = await (this.prisma as any).leagueEntry.update({
      where: { id: entry.id },
      data: { points: { increment: points } },
      include: { league: true },
    });

    const tier: Tier = updated.league.tier as Tier;
    const threshold = SEASON_PROMOTION_THRESHOLDS[tier];

    if (updated.points >= threshold && !updated.promoted) {
      await this.promotePlayer(userId, updated);
    }
  }

  // ─── PROMOTE PLAYER ──────────────────────────────────────────────────────────

  async promotePlayer(userId: string, entry: any) {
    await (this.prisma as any).leagueEntry.update({
      where: { id: entry.id },
      data: { promoted: true },
    });

    const next = nextTier(entry.league.tier as Tier);

    this.emitToUser(userId, 'league_promotion', {
      currentTier: entry.league.tier,
      nextTier: next,
      game: entry.league.game,
      message: `🎖️ Vous serez promu ${next} la prochaine saison !`,
    });

    this.logger.log(`User ${userId} flagged for promotion ${entry.league.tier} → ${next} (game: ${entry.league.game})`);
  }

  // ─── END SEASON (cron: 1er de chaque mois) ───────────────────────────────────

  @Cron('0 0 1 * *')
  async endSeason() {
    this.logger.log('Running end-of-season processing…');
    const season = prevSeason();
    const newSeason = currentSeason();

    const leagues = await (this.prisma as any).league.findMany({
      where: { season },
      include: { entries: true },
    });

    for (const league of leagues) {
      await this.processLeagueEndSeason(league, newSeason);
    }
  }

  private async processLeagueEndSeason(league: any, newSeason: number) {
    const entries: any[] = [...league.entries].sort((a: any, b: any) => b.points - a.points);
    const total = entries.length;
    if (total === 0) return;

    const promoteCount = Math.max(1, Math.floor(total * 0.20));
    const relegateCount = Math.max(1, Math.floor(total * 0.20));

    for (let i = 0; i < total; i++) {
      const entry = entries[i];
      const rank = i + 1;
      let nextTierForEntry: Tier = league.tier as Tier;
      let promoted = false;
      let relegated = false;

      if (i < promoteCount || entry.promoted) {
        nextTierForEntry = nextTier(league.tier as Tier);
        promoted = true;
      } else if (i >= total - relegateCount && !entry.promoted) {
        nextTierForEntry = prevTierOf(league.tier as Tier);
        relegated = true;
      }

      // Update current entry with final rank/status
      await (this.prisma as any).leagueEntry.update({
        where: { id: entry.id },
        data: { rank, promoted, relegated },
      });

      // Create entry for next season
      const nextLeague = await this.getOrCreateLeague(nextTierForEntry, league.game, newSeason);
      const alreadyExists = await (this.prisma as any).leagueEntry.findUnique({
        where: { leagueId_userId: { leagueId: nextLeague.id, userId: entry.userId } },
      });
      if (!alreadyExists) {
        await (this.prisma as any).leagueEntry.create({
          data: { leagueId: nextLeague.id, userId: entry.userId },
        });
      }

      if (promoted) {
        this.emitToUser(entry.userId, 'league_promotion', {
          currentTier: league.tier,
          nextTier: nextTierForEntry,
          game: league.game,
          season: newSeason,
          message: `🎖️ Promotion confirmée — vous rejoignez ${nextTierForEntry} !`,
        });
      }
    }

    this.logger.log(`Season ${league.season} ended for ${league.game} / ${league.tier}: ${total} players processed`);
  }

  // ─── QUERIES ─────────────────────────────────────────────────────────────────

  async getMyLeagues(userId: string) {
    const season = currentSeason();
    return (this.prisma as any).leagueEntry.findMany({
      where: { userId, league: { season } },
      include: { league: true },
      orderBy: { points: 'desc' },
    });
  }

  async getLeagueStandings(leagueId: string) {
    return (this.prisma as any).leagueEntry.findMany({
      where: { leagueId },
      include: { user: { select: { id: true, username: true, avatar: true } } },
      orderBy: [{ points: 'desc' }, { rank: 'asc' }],
    });
  }

  // ─── INTERNAL HELPERS ─────────────────────────────────────────────────────────

  private async findCurrentEntry(userId: string, game: string, season: number) {
    return (this.prisma as any).leagueEntry.findFirst({
      where: { userId, league: { game, season } },
      include: { league: true },
    });
  }
}
