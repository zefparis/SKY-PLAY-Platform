import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { LeaguesService } from '../leagues/leagues.service';

/**
 * Round-robin calendar generation using the circular rotation (polygon) algorithm.
 * Fixes position 0, rotates positions 1..n-1 to generate n-1 rounds for n players.
 * Returns: array of rounds, each round is an array of [player1Id, player2Id] pairs.
 */
function buildRoundRobinRounds(playerIds: string[]): Array<Array<[string, string]>> {
  const list = playerIds.length % 2 === 0 ? [...playerIds] : [...playerIds, 'BYE'];
  const n = list.length;
  const rounds: Array<Array<[string, string]>> = [];

  for (let r = 0; r < n - 1; r++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const p1 = list[i];
      const p2 = list[n - 1 - i];
      if (p1 !== 'BYE' && p2 !== 'BYE') {
        pairs.push([p1, p2]);
      }
    }
    rounds.push(pairs);
    // Rotate: keep list[0] fixed, move last element to position 1
    const last = list.pop()!;
    list.splice(1, 0, last);
  }

  return rounds;
}

@Injectable()
export class ChampionshipService {
  private server: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly leagueService: LeaguesService,
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

  // ─── GENERATE CHAMPIONSHIP CALENDAR ─────────────────────────────────────────

  async generateChampionshipCalendar(tournamentId: string) {
    const tournament = await (this.prisma as any).tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: true },
    });
    if (!tournament) throw new NotFoundException('Tournoi introuvable');

    const participants: any[] = tournament.participants;
    if (participants.length < 4) {
      throw new BadRequestException('Un championnat nécessite au minimum 4 participants');
    }

    const playerIds = participants.map((p: any) => p.userId);

    // ─── Aller ────────────────────────────────────────────────────────────────
    const allerRounds = buildRoundRobinRounds(playerIds);

    // ─── Retour (inverser P1/P2) ──────────────────────────────────────────────
    const retourRounds = allerRounds.map(
      (round) => round.map(([p1, p2]) => [p2, p1] as [string, string]),
    );

    const allRounds = [...allerRounds, ...retourRounds];
    const totalRounds = allerRounds.length; // journées aller

    // ─── Création des matchs en base ──────────────────────────────────────────
    const createdMatchIds: string[] = [];
    for (let r = 0; r < allRounds.length; r++) {
      const journee = r + 1;
      const leg = r < totalRounds ? 'ALLER' : 'RETOUR';
      for (const [p1Id, p2Id] of allRounds[r]) {
        const match = await (this.prisma as any).tournamentMatch.create({
          data: {
            tournamentId,
            phase: 'CHAMPIONSHIP_ROUND',
            round: journee,
            player1Id: p1Id,
            player2Id: p2Id,
            status: 'PENDING',
            leg,
          },
        });
        createdMatchIds.push(match.id);
      }
    }

    await (this.prisma as any).tournament.update({
      where: { id: tournamentId },
      data: { status: 'POOL_PHASE' },
    });

    this.emitToTournament(tournamentId, 'tournament_update', {
      tournamentId,
      event: 'championship_calendar_generated',
      totalJournees: allRounds.length,
    });

    // Notify first journée matches
    const firstJournee = await (this.prisma as any).tournamentMatch.findMany({
      where: { tournamentId, phase: 'CHAMPIONSHIP_ROUND', round: 1 },
    });
    for (const m of firstJournee) {
      this.emitToUser(m.player1Id, 'match_ready', { matchId: m.id, tournamentId, phase: 'CHAMPIONSHIP_ROUND', round: 1 });
      this.emitToUser(m.player2Id, 'match_ready', { matchId: m.id, tournamentId, phase: 'CHAMPIONSHIP_ROUND', round: 1 });
    }

    return { totalMatches: createdMatchIds.length, totalJournees: allRounds.length };
  }

  // ─── HANDLE MATCH APPLIED (appelé depuis TournamentsService) ─────────────────

  async handleMatchApplied(tournamentId: string) {
    await this.updateStandingsSnapshot(tournamentId);
    await this.checkChampionshipComplete(tournamentId);
  }

  // ─── UPDATE STANDINGS SNAPSHOT ────────────────────────────────────────────────

  private async updateStandingsSnapshot(tournamentId: string) {
    const standings = await this.computeChampionshipStandings(tournamentId);
    await (this.prisma as any).tournament.update({
      where: { id: tournamentId },
      data: { standingsJson: standings as any },
    });
  }

  // ─── COMPUTE CHAMPIONSHIP STANDINGS ──────────────────────────────────────────

  async computeChampionshipStandings(tournamentId: string) {
    const participants = await (this.prisma as any).tournamentParticipant.findMany({
      where: { tournamentId },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });

    return [...participants].sort((a: any, b: any) => {
      // 1. Points
      if (b.points !== a.points) return b.points - a.points;
      // 2. Différence de buts
      const aDiff = a.goalsFor - a.goalsAgainst;
      const bDiff = b.goalsFor - b.goalsAgainst;
      if (bDiff !== aDiff) return bDiff - aDiff;
      // 3. Buts marqués
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      // 4. Victoires
      if (b.wins !== a.wins) return b.wins - a.wins;
      // 5. Face-à-face : non déterminable sans requête supplémentaire → buts à l'extérieur
      // 6. Buts à l'extérieur (joueur = player2 dans ce match)
      // 7. Fair-play
      const aCards = a.yellowCards + a.redCards * 3;
      const bCards = b.yellowCards + b.redCards * 3;
      return aCards - bCards;
    });
  }

  // ─── CHECK CHAMPIONSHIP COMPLETE ─────────────────────────────────────────────

  private async checkChampionshipComplete(tournamentId: string) {
    const pending = await (this.prisma as any).tournamentMatch.count({
      where: {
        tournamentId,
        phase: 'CHAMPIONSHIP_ROUND',
        status: { not: 'COMPLETED' },
      },
    });
    if (pending > 0) return;

    await this.completeChampionship(tournamentId);
  }

  // ─── COMPLETE CHAMPIONSHIP ────────────────────────────────────────────────────

  private async completeChampionship(tournamentId: string) {
    const tournament = await (this.prisma as any).tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: true },
    });
    if (!tournament) return;

    const standings = await this.computeChampionshipStandings(tournamentId);
    const potNet = Math.floor(tournament.potTotal * (1 - tournament.commission));
    const prizes: Record<number, number> = {
      1: Math.floor(potNet * 0.50),
      2: Math.floor(potNet * 0.25),
      3: Math.floor(potNet * 0.15),
    };

    const distribute = async (participant: any, rank: number) => {
      if (!participant) return;
      const prize = prizes[rank] ?? 0;
      await (this.prisma as any).tournamentParticipant.update({
        where: { tournamentId_userId: { tournamentId, userId: participant.userId } },
        data: { finalRank: rank, winnings: prize },
      });
      if (prize > 0) {
        await this.walletService.credit(
          participant.userId,
          prize,
          'CHALLENGE_WIN',
          `Championnat ${tournament.title} — ${rank}${rank === 1 ? 'er' : 'ème'}`,
        );
      }
      this.emitToUser(participant.userId, 'tournament_completed', { tournamentId, rank, winnings: prize });
    };

    await distribute(standings[0], 1);
    await distribute(standings[1], 2);
    await distribute(standings[2], 3);

    // League points pour le championnat
    const lpMap: Record<number, number> = { 1: 200, 2: 100, 3: 50 };
    for (const [i, pts] of [[0, lpMap[1]], [1, lpMap[2]], [2, lpMap[3]]] as [number, number][]) {
      if (standings[i]) this.leagueService.awardLeaguePoints(standings[i].userId, tournament.game, pts).catch(() => {});
    }

    // XP pour tous les participants
    for (let i = 0; i < standings.length; i++) {
      const p: any = standings[i];
      const xpGain = i === 0 ? 200 : i === 1 ? 100 : i === 2 ? 50 : 20;
      const updated = await this.prisma.user.update({
        where: { id: p.userId },
        data: {
          gamesPlayed: { increment: 1 },
          xp: { increment: xpGain },
          ...(i === 0 ? { gamesWon: { increment: 1 } } : {}),
        },
        select: { xp: true, level: true },
      });
      const newLevel = Math.floor(updated.xp / 200) + 1;
      if (newLevel !== updated.level) {
        await this.prisma.user.update({ where: { id: p.userId }, data: { level: newLevel } });
      }
    }

    const finalStandings = await this.computeChampionshipStandings(tournamentId);
    await (this.prisma as any).tournament.update({
      where: { id: tournamentId },
      data: { status: 'COMPLETED', standingsJson: finalStandings as any },
    });

    this.emitToTournament(tournamentId, 'tournament_completed', {
      tournamentId,
      winners: {
        first: standings[0]?.userId ?? null,
        second: standings[1]?.userId ?? null,
        third: standings[2]?.userId ?? null,
        prizes,
      },
    });
  }

  // ─── GET CALENDAR ─────────────────────────────────────────────────────────────

  async getCalendar(tournamentId: string) {
    const matches = await (this.prisma as any).tournamentMatch.findMany({
      where: { tournamentId, phase: 'CHAMPIONSHIP_ROUND' },
      include: {
        player1: { select: { id: true, username: true, avatar: true } },
        player2: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
    });

    const grouped: Record<number, any[]> = {};
    for (const m of matches) {
      if (!grouped[m.round]) grouped[m.round] = [];
      grouped[m.round].push(m);
    }
    return grouped;
  }
}
