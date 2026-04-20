import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateTournamentDto, JoinTournamentDto, SubmitMatchResultDto } from './dto/tournament.dto';

const POOL_SIZE = 4;
const DEFAULT_COMMISSION = 0.10;
const PHASE_ORDER = ['ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL'] as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

@Injectable()
export class TournamentsService {
  private server: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  setServer(server: any) {
    this.server = server;
  }

  private emitToUser(userId: string, event: string, data: any) {
    this.server?.to(`user_${userId}`).emit(event, data);
  }

  private emitToTournament(tournamentId: string, event: string, data: any) {
    this.server?.to(`tournament_${tournamentId}`).emit(event, data);
  }

  // ─── FIND ONE ─────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const t = await (this.prisma as any).tournament.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, username: true, avatar: true } },
        participants: { include: { user: { select: { id: true, username: true, avatar: true } } } },
        pools: {
          include: {
            participants: { include: { user: { select: { id: true, username: true, avatar: true } } } },
            matches: true,
          },
        },
        matches: true,
      },
    });
    if (!t) throw new NotFoundException('Tournoi introuvable');
    return t;
  }

  // ─── FIND ALL ─────────────────────────────────────────────────────────────

  async findAll(filters: { game?: string; type?: string; status?: string; page?: number; limit?: number }) {
    const { game, type, status, page = 1, limit = 20 } = filters;
    const where: any = {};
    if (game) where.game = { contains: game, mode: 'insensitive' };
    if (type) where.type = type;
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [tournaments, total] = await Promise.all([
      (this.prisma as any).tournament.findMany({
        where,
        include: {
          creator: { select: { id: true, username: true, avatar: true } },
          _count: { select: { participants: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (this.prisma as any).tournament.count({ where }),
    ]);

    return { tournaments, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async createTournament(dto: CreateTournamentDto, creatorId: string) {
    const { title, game, type, format, entryFee, maxPlayers, commission } = dto;
    const isSimple = type === 'SIMPLE';

    if (isSimple && ![8, 16, 32].includes(maxPlayers)) {
      throw new BadRequestException('SIMPLE: maxPlayers doit être 8, 16 ou 32');
    }
    if (!isSimple && (maxPlayers % 10 !== 0 || maxPlayers < 10)) {
      throw new BadRequestException('PREMIUM: maxPlayers doit être un multiple de 10');
    }

    const tournament = await (this.prisma as any).tournament.create({
      data: {
        title, game,
        type: type as any,
        format: format as any,
        status: 'OPEN',
        entryFee,
        maxPlayers,
        commission: commission ?? DEFAULT_COMMISSION,
        creatorId,
      },
    });

    await this.walletService.debit(creatorId, entryFee, 'CHALLENGE_ENTRY', `Inscription tournoi: ${title}`);

    await (this.prisma as any).tournamentParticipant.create({
      data: { tournamentId: tournament.id, userId: creatorId },
    });

    await (this.prisma as any).tournament.update({ where: { id: tournament.id }, data: { potTotal: entryFee } });

    return tournament;
  }

  // ─── JOIN ─────────────────────────────────────────────────────────────────

  async joinTournament(tournamentId: string, userId: string, dto?: JoinTournamentDto) {
    const tournament = await this.findOne(tournamentId);

    if (tournament.status !== 'OPEN') throw new BadRequestException('Ce tournoi n\'est plus ouvert');
    if (tournament.participants.some((p: any) => p.userId === userId)) {
      throw new BadRequestException('Vous êtes déjà inscrit à ce tournoi');
    }
    if (tournament.participants.length >= tournament.maxPlayers) {
      throw new BadRequestException('Le tournoi est complet');
    }

    await this.walletService.debit(userId, tournament.entryFee, 'CHALLENGE_ENTRY', `Inscription tournoi: ${tournament.title}`);

    await (this.prisma as any).tournamentParticipant.create({
      data: { tournamentId, userId, teamName: dto?.teamName ?? null, nation: dto?.nation ?? null },
    });

    const newPot = tournament.potTotal + tournament.entryFee;
    await (this.prisma as any).tournament.update({ where: { id: tournamentId }, data: { potTotal: newPot } });

    const count = tournament.participants.length + 1;
    this.emitToTournament(tournamentId, 'tournament_update', { tournamentId, event: 'participant_joined', count });

    if (count >= tournament.maxPlayers) {
      setTimeout(() => this.generatePools(tournamentId), 2000);
    }

    return { joined: true, tournamentId };
  }

  // ─── GENERATE POOLS ──────────────────────────────────────────────────────

  async generatePools(tournamentId: string) {
    const tournament = await this.findOne(tournamentId);
    const participants = shuffle(tournament.participants as any[]);
    const poolLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const poolCount = Math.ceil(participants.length / POOL_SIZE);

    for (let i = 0; i < poolCount; i++) {
      const slice = participants.slice(i * POOL_SIZE, (i + 1) * POOL_SIZE);
      const pool = await (this.prisma as any).pool.create({
        data: { tournamentId, name: `Groupe ${poolLabels[i]}` },
      });

      for (const p of slice) {
        await (this.prisma as any).tournamentParticipant.update({
          where: { tournamentId_userId: { tournamentId, userId: p.userId } },
          data: { poolId: pool.id },
        });
      }

      await this.generatePoolMatches(pool.id, tournamentId, slice.map((p: any) => p.userId));
    }

    await (this.prisma as any).tournament.update({ where: { id: tournamentId }, data: { status: 'POOL_PHASE' } });
    this.emitToTournament(tournamentId, 'tournament_update', { tournamentId, event: 'pool_phase_started' });

    // Notify players of round 1 matches
    const round1 = await (this.prisma as any).tournamentMatch.findMany({
      where: { tournamentId, phase: 'POOL', round: 1 },
    });
    for (const m of round1) {
      this.emitToUser(m.player1Id, 'match_ready', { matchId: m.id, tournamentId, phase: 'POOL', round: 1 });
      this.emitToUser(m.player2Id, 'match_ready', { matchId: m.id, tournamentId, phase: 'POOL', round: 1 });
    }
  }

  // ─── GENERATE POOL MATCHES (round-robin aller simple) ────────────────────

  private async generatePoolMatches(poolId: string, tournamentId: string, userIds: string[]) {
    const n = userIds.length;
    let round = 1;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        await (this.prisma as any).tournamentMatch.create({
          data: {
            tournamentId,
            poolId,
            phase: 'POOL',
            round,
            player1Id: userIds[i],
            player2Id: userIds[j],
            status: 'PENDING',
          },
        });
        round++;
      }
    }
  }

  // ─── SUBMIT MATCH RESULT ─────────────────────────────────────────────────

  async submitMatchResult(matchId: string, userId: string, dto: SubmitMatchResultDto) {
    const match = await (this.prisma as any).tournamentMatch.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match introuvable');

    const isP1 = userId === match.player1Id;
    const isP2 = userId === match.player2Id;
    if (!isP1 && !isP2) throw new ForbiddenException('Vous n\'êtes pas participant à ce match');
    if (match.status === 'COMPLETED') throw new BadRequestException('Ce match est déjà terminé');
    if (match.status === 'DISPUTED') throw new BadRequestException('Ce match est en litige — contactez un administrateur');
    if (isP1 && match.score1 !== null) throw new BadRequestException('Vous avez déjà soumis votre résultat');
    if (isP2 && match.score2 !== null) throw new BadRequestException('Vous avez déjà soumis votre résultat');

    const screenshotUrl = dto.screenshotUrl ?? null;

    const updateData: any = isP1
      ? { score1: dto.myGoals, yellowCards1: dto.yellowCards, redCards1: dto.redCards, screenshot1: screenshotUrl, status: 'AWAITING_RESULTS' }
      : { score2: dto.myGoals, yellowCards2: dto.yellowCards, redCards2: dto.redCards, screenshot2: screenshotUrl, status: 'AWAITING_RESULTS' };

    const updated = await (this.prisma as any).tournamentMatch.update({ where: { id: matchId }, data: updateData });

    if (updated.score1 !== null && updated.score2 !== null) {
      await this.checkMatchConsensus(updated);
    }

    return updated;
  }

  // ─── CHECK MATCH CONSENSUS ───────────────────────────────────────────────

  private async checkMatchConsensus(match: any) {
    // Each player reports their own goals — scores are independent, no dispute possible
    await this.applyMatchResult(match);
  }

  // ─── APPLY MATCH RESULT ──────────────────────────────────────────────────

  private async applyMatchResult(match: any) {
    const { id, score1, score2, player1Id, player2Id, tournamentId, phase } = match;
    const winnerId = score1 > score2 ? player1Id : score2 > score1 ? player2Id : null;

    const p1Points = score1 > score2 ? 3 : score1 === score2 ? 1 : 0;
    const p2Points = score2 > score1 ? 3 : score2 === score1 ? 1 : 0;
    const draw = score1 === score2 ? 1 : 0;

    await (this.prisma as any).tournamentParticipant.update({
      where: { tournamentId_userId: { tournamentId, userId: player1Id } },
      data: {
        points: { increment: p1Points },
        goalsFor: { increment: score1 ?? 0 },
        goalsAgainst: { increment: score2 ?? 0 },
        wins: { increment: score1 > score2 ? 1 : 0 },
        draws: { increment: draw },
        losses: { increment: score1 < score2 ? 1 : 0 },
        yellowCards: { increment: match.yellowCards1 ?? 0 },
        redCards: { increment: match.redCards1 ?? 0 },
      },
    });

    await (this.prisma as any).tournamentParticipant.update({
      where: { tournamentId_userId: { tournamentId, userId: player2Id } },
      data: {
        points: { increment: p2Points },
        goalsFor: { increment: score2 ?? 0 },
        goalsAgainst: { increment: score1 ?? 0 },
        wins: { increment: score2 > score1 ? 1 : 0 },
        draws: { increment: draw },
        losses: { increment: score2 < score1 ? 1 : 0 },
        yellowCards: { increment: match.yellowCards2 ?? 0 },
        redCards: { increment: match.redCards2 ?? 0 },
      },
    });

    await (this.prisma as any).tournamentMatch.update({
      where: { id },
      data: { status: 'COMPLETED', winnerId, playedAt: new Date() },
    });

    this.emitToTournament(tournamentId, 'tournament_update', { event: 'match_completed', matchId: id, score1, score2, winnerId });

    if (phase === 'POOL') {
      await this.checkPoolsComplete(tournamentId);
    } else {
      await this.advanceKnockout(id);
    }
  }

  // ─── CHECK POOLS COMPLETE ────────────────────────────────────────────────

  private async checkPoolsComplete(tournamentId: string) {
    const pending = await (this.prisma as any).tournamentMatch.count({
      where: { tournamentId, phase: 'POOL', status: { not: 'COMPLETED' } },
    });
    if (pending > 0) return;

    const pools = await (this.prisma as any).pool.findMany({ where: { tournamentId } });
    const qualifiedIds: string[] = [];

    for (const pool of pools) {
      const standings = await this.computePoolStandings(pool.id);
      qualifiedIds.push(...standings.slice(0, 2).map((p: any) => p.userId));
    }

    await this.generateKnockoutPhase(tournamentId, qualifiedIds);
  }

  // ─── COMPUTE POOL STANDINGS ──────────────────────────────────────────────

  async computePoolStandings(poolId: string) {
    const participants = await (this.prisma as any).tournamentParticipant.findMany({
      where: { poolId },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });

    return [...participants].sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      const aDiff = a.goalsFor - a.goalsAgainst;
      const bDiff = b.goalsFor - b.goalsAgainst;
      if (bDiff !== aDiff) return bDiff - aDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      if (b.wins !== a.wins) return b.wins - a.wins;
      const aCards = a.yellowCards + a.redCards * 3;
      const bCards = b.yellowCards + b.redCards * 3;
      return aCards - bCards;
    });
  }

  // ─── GENERATE KNOCKOUT PHASE ─────────────────────────────────────────────

  private async generateKnockoutPhase(tournamentId: string, qualifiedIds: string[]) {
    const count = qualifiedIds.length;
    const firstPhase = count >= 16 ? 'ROUND_OF_16' : count >= 8 ? 'QUARTER_FINAL' : 'SEMI_FINAL';

    const seeded = shuffle(qualifiedIds);
    for (let i = 0; i < seeded.length; i += 2) {
      const m = await (this.prisma as any).tournamentMatch.create({
        data: { tournamentId, phase: firstPhase, round: 1, player1Id: seeded[i], player2Id: seeded[i + 1], status: 'PENDING' },
      });
      this.emitToUser(seeded[i],     'match_ready', { matchId: m.id, tournamentId, phase: firstPhase });
      this.emitToUser(seeded[i + 1], 'match_ready', { matchId: m.id, tournamentId, phase: firstPhase });
    }

    await (this.prisma as any).tournament.update({ where: { id: tournamentId }, data: { status: 'KNOCKOUT_PHASE' } });
    this.emitToTournament(tournamentId, 'tournament_update', { tournamentId, event: 'knockout_phase_started', phase: firstPhase });
  }

  // ─── ADVANCE KNOCKOUT ────────────────────────────────────────────────────

  private async advanceKnockout(matchId: string) {
    const match = await (this.prisma as any).tournamentMatch.findUnique({ where: { id: matchId } });
    if (!match) return;
    const { phase, tournamentId } = match;

    // Both FINAL and THIRD_PLACE must complete before distributing prizes
    if (phase === 'FINAL' || phase === 'THIRD_PLACE') {
      const [finalDone, thirdDone] = await Promise.all([
        (this.prisma as any).tournamentMatch.count({ where: { tournamentId, phase: 'FINAL', status: 'COMPLETED' } }),
        (this.prisma as any).tournamentMatch.count({ where: { tournamentId, phase: 'THIRD_PLACE', status: 'COMPLETED' } }),
      ]);
      if (finalDone > 0 && thirdDone > 0) {
        await this.completeTournament(tournamentId);
      }
      return;
    }

    // Check if all matches in current phase are done
    const pending = await (this.prisma as any).tournamentMatch.count({
      where: { tournamentId, phase, status: { not: 'COMPLETED' } },
    });
    if (pending > 0) return;

    if (phase === 'SEMI_FINAL') {
      const semis = await (this.prisma as any).tournamentMatch.findMany({
        where: { tournamentId, phase: 'SEMI_FINAL', status: 'COMPLETED' },
      });
      const winnerIds: string[] = semis.map((m: any) => m.winnerId).filter(Boolean);
      const loserIds: string[] = semis.map((m: any) =>
        m.winnerId === m.player1Id ? m.player2Id : m.player1Id,
      );

      if (loserIds.length === 2) {
        const third = await (this.prisma as any).tournamentMatch.create({
          data: { tournamentId, phase: 'THIRD_PLACE', round: 1, player1Id: loserIds[0], player2Id: loserIds[1], status: 'PENDING' },
        });
        this.emitToUser(loserIds[0], 'match_ready', { matchId: third.id, tournamentId, phase: 'THIRD_PLACE' });
        this.emitToUser(loserIds[1], 'match_ready', { matchId: third.id, tournamentId, phase: 'THIRD_PLACE' });
      }
      if (winnerIds.length === 2) {
        const final = await (this.prisma as any).tournamentMatch.create({
          data: { tournamentId, phase: 'FINAL', round: 1, player1Id: winnerIds[0], player2Id: winnerIds[1], status: 'PENDING' },
        });
        this.emitToUser(winnerIds[0], 'match_ready', { matchId: final.id, tournamentId, phase: 'FINAL' });
        this.emitToUser(winnerIds[1], 'match_ready', { matchId: final.id, tournamentId, phase: 'FINAL' });
      }
      return;
    }

    // ROUND_OF_16 → QUARTER_FINAL → SEMI_FINAL
    const currentIdx = PHASE_ORDER.indexOf(phase as any);
    const nextPhase = PHASE_ORDER[currentIdx + 1];
    if (!nextPhase) return;

    const completed = await (this.prisma as any).tournamentMatch.findMany({
      where: { tournamentId, phase, status: 'COMPLETED' },
    });
    const winners = completed.map((m: any) => m.winnerId).filter(Boolean);

    for (let i = 0; i < winners.length; i += 2) {
      const next = await (this.prisma as any).tournamentMatch.create({
        data: { tournamentId, phase: nextPhase, round: 1, player1Id: winners[i], player2Id: winners[i + 1], status: 'PENDING' },
      });
      this.emitToUser(winners[i],     'match_ready', { matchId: next.id, tournamentId, phase: nextPhase });
      this.emitToUser(winners[i + 1], 'match_ready', { matchId: next.id, tournamentId, phase: nextPhase });
    }

    this.emitToTournament(tournamentId, 'tournament_update', { tournamentId, event: 'phase_advanced', phase: nextPhase });
  }

  // ─── COMPLETE TOURNAMENT ─────────────────────────────────────────────────

  private async completeTournament(tournamentId: string) {
    const tournament = await this.findOne(tournamentId);
    const potNet = Math.floor(tournament.potTotal * (1 - tournament.commission));

    const finalMatch = await (this.prisma as any).tournamentMatch.findFirst({
      where: { tournamentId, phase: 'FINAL', status: 'COMPLETED' },
    });
    const thirdMatch = await (this.prisma as any).tournamentMatch.findFirst({
      where: { tournamentId, phase: 'THIRD_PLACE', status: 'COMPLETED' },
    });

    const winnerId: string | null = finalMatch?.winnerId ?? null;
    const secondId: string | null = winnerId
      ? (winnerId === finalMatch?.player1Id ? finalMatch?.player2Id : finalMatch?.player1Id)
      : null;
    const thirdId: string | null = thirdMatch?.winnerId ?? null;

    const prizes: Record<string, number> = { [1]: Math.floor(potNet * 0.50), [2]: Math.floor(potNet * 0.25), [3]: Math.floor(potNet * 0.15) };

    const distribute = async (userId: string | null, rank: number) => {
      if (!userId) return;
      const prize = prizes[rank] ?? 0;
      await (this.prisma as any).tournamentParticipant.update({
        where: { tournamentId_userId: { tournamentId, userId } },
        data: { finalRank: rank, winnings: prize },
      });
      if (prize > 0) {
        await this.walletService.credit(userId, prize, 'CHALLENGE_WIN', `Tournoi ${tournament.title} — ${rank}${rank === 1 ? 'er' : 'ème'}`);
      }
      this.emitToUser(userId, 'tournament_completed', { tournamentId, rank, winnings: prize });
    };

    await distribute(winnerId, 1);
    await distribute(secondId, 2);
    await distribute(thirdId, 3);

    // XP & stats for all participants
    for (const p of tournament.participants as any[]) {
      const xpGain = p.userId === winnerId ? 200 : p.userId === secondId ? 100 : p.userId === thirdId ? 50 : 20;
      const updated = await this.prisma.user.update({
        where: { id: p.userId },
        data: {
          gamesPlayed: { increment: 1 },
          xp: { increment: xpGain },
          ...(p.userId === winnerId ? { gamesWon: { increment: 1 } } : {}),
        },
        select: { xp: true, level: true },
      });
      const newLevel = Math.floor(updated.xp / 200) + 1;
      if (newLevel !== updated.level) {
        await this.prisma.user.update({ where: { id: p.userId }, data: { level: newLevel } });
      }
    }

    await (this.prisma as any).tournament.update({ where: { id: tournamentId }, data: { status: 'COMPLETED' } });

    const winners = { first: winnerId, second: secondId, third: thirdId, prizes };
    this.emitToTournament(tournamentId, 'tournament_completed', { tournamentId, winners });

    return winners;
  }

  // ─── BRACKET ─────────────────────────────────────────────────────────────

  async getBracket(tournamentId: string) {
    const matches = await (this.prisma as any).tournamentMatch.findMany({
      where: { tournamentId, phase: { not: 'POOL' } },
      include: {
        player1: { select: { id: true, username: true, avatar: true } },
        player2: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: [{ phase: 'asc' }, { round: 'asc' }],
    });

    const grouped: Record<string, any[]> = {};
    for (const m of matches) {
      if (!grouped[m.phase]) grouped[m.phase] = [];
      grouped[m.phase].push(m);
    }
    return grouped;
  }

  // ─── STANDINGS ────────────────────────────────────────────────────────────

  async getStandings(tournamentId: string) {
    const pools = await (this.prisma as any).pool.findMany({ where: { tournamentId } });
    const standings: Record<string, any[]> = {};
    for (const pool of pools) {
      standings[pool.name] = await this.computePoolStandings(pool.id);
    }
    return standings;
  }

  // ─── WINNERS ─────────────────────────────────────────────────────────────

  async getWinners(tournamentId: string) {
    return (this.prisma as any).tournamentParticipant.findMany({
      where: { tournamentId, finalRank: { not: null } },
      include: { user: { select: { id: true, username: true, avatar: true } } },
      orderBy: { finalRank: 'asc' },
    });
  }
}
