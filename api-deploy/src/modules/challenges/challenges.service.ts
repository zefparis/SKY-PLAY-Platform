import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ChatService } from '../chat/chat.service';
import { CHALLENGE_TYPES, PRIZE_DISTRIBUTION } from './challenges.constants';

type ChallengeTypeKey = keyof typeof CHALLENGE_TYPES;

const PARTICIPANT_SELECT = {
  id: true,
  userId: true,
  joinedAt: true,
  hasPaid: true,
  rank: true,
  winnings: true,
  user: {
    select: { id: true, username: true, avatar: true },
  },
};

@Injectable()
export class ChallengesService {
  private server: any = null; // Set by ChatGateway via setServer()

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    @Inject(forwardRef(() => ChatService)) private chatService: ChatService,
  ) {}

  setServer(server: any) {
    this.server = server;
  }

  private notifyChallenge(challengeId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`challenge_${challengeId}`).emit(event, data);
    }
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────────

  async create(userId: string, title: string, game: string, type: string) {
    const config = CHALLENGE_TYPES[type as ChallengeTypeKey];
    if (!config) throw new BadRequestException('Type de défi invalide');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const challenge = await this.prisma.challenge.create({
      data: {
        title,
        game,
        type: type as any,
        entryFee: config.entryFee,
        maxPlayers: config.maxPlayers,
        commission: config.commission,
        creatorId: userId,
        expiresAt,
      },
    });

    // Creator joins automatically
    await this.walletService.debit(
      userId,
      config.entryFee,
      'CHALLENGE_ENTRY',
      `Entrée défi: ${title}`,
    );

    await this.prisma.challengeParticipant.create({
      data: { challengeId: challenge.id, userId, hasPaid: true },
    });

    await this.prisma.challenge.update({
      where: { id: challenge.id },
      data: { potTotal: config.entryFee },
    });

    return this.findOne(challenge.id);
  }

  // ─── FIND ALL ─────────────────────────────────────────────────────────────────

  async findAll(filters?: {
    status?: string;
    game?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.min(50, filters?.limit ?? 20);

    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.game) where.game = { contains: filters.game, mode: 'insensitive' };
    if (filters?.type) where.type = filters.type;

    const [challenges, total] = await Promise.all([
      this.prisma.challenge.findMany({
        where,
        include: {
          creator: { select: { id: true, username: true, avatar: true } },
          _count: { select: { participants: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.challenge.count({ where }),
    ]);

    return { challenges, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ─── FIND ONE ────────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, username: true, avatar: true } },
        participants: {
          select: PARTICIPANT_SELECT,
          orderBy: { joinedAt: 'asc' },
        },
        results: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
        dispute: true,
      },
    });

    if (!challenge) throw new NotFoundException('Défi introuvable');
    return challenge;
  }

  // ─── ACCEPT RULES ──────────────────────────────────────────────────────────

  async acceptRules(challengeId: string, userId: string, dto: { rulesVersion: string; rulesHash: string }, ipAddress?: string, userAgent?: string) {
    const challenge = await this.findOne(challengeId);
    if (!challenge) throw new NotFoundException('Défi introuvable');

    await this.prisma.challengeRuleAcceptance.upsert({
      where: { userId_challengeId: { userId, challengeId } },
      create: { userId, challengeId, rulesVersion: dto.rulesVersion, rulesHash: dto.rulesHash, ipAddress, userAgent },
      update: { rulesVersion: dto.rulesVersion, rulesHash: dto.rulesHash, ipAddress, userAgent, acceptedAt: new Date() },
    });

    return { accepted: true, timestamp: new Date().toISOString(), challengeId };
  }

  async getRulesAcceptance(challengeId: string, userId: string) {
    return this.prisma.challengeRuleAcceptance.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
  }

  // ─── JOIN ────────────────────────────────────────────────────────────────────

  async join(challengeId: string, userId: string) {
    const challenge = await this.findOne(challengeId);

    if (challenge.status !== 'OPEN') {
      throw new BadRequestException('Ce défi n\'est plus ouvert');
    }

    const alreadyJoined = challenge.participants.some((p) => p.userId === userId);
    if (alreadyJoined) throw new BadRequestException('Tu es déjà inscrit à ce défi');

    if (challenge.participants.length >= challenge.maxPlayers) {
      throw new BadRequestException('Ce défi est complet');
    }

    // ─── Vérification acceptation du règlement ──────────────────────────────
    const ruleAcceptance = await this.prisma.challengeRuleAcceptance.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
    if (!ruleAcceptance) {
      throw new ForbiddenException('Vous devez accepter le règlement de la compétition avant de vous inscrire.');
    }

    // ─── Vérification limite de dépense journalière ───────────────────────────
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { dailySpendLimit: true } });
    const dailyLimit = user?.dailySpendLimit ?? 20000;
    const wallet = await this.prisma.wallet.findFirst({ where: { userId } });
    if (wallet) {
      const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
      const spentToday = await this.prisma.transaction.aggregate({
        where: { walletId: wallet.id, type: { in: ['CHALLENGE_ENTRY', 'CHALLENGE_DEBIT'] as any }, createdAt: { gte: dayStart } },
        _sum: { amount: true },
      });
      const totalSpent = Math.abs(Number(spentToday._sum.amount ?? 0));
      if (totalSpent + challenge.entryFee > dailyLimit) {
        throw new ForbiddenException(`Limite de mise journalière atteinte (${dailyLimit} SKY/jour). Déjà misé aujourd'hui : ${Math.round(totalSpent)} SKY.`);
      }
    }

    await this.walletService.debit(
      userId,
      challenge.entryFee,
      'CHALLENGE_ENTRY',
      `Entrée défi: ${challenge.title}`,
    );

    await this.prisma.challengeParticipant.create({
      data: { challengeId, userId, hasPaid: true },
    });

    const newPot = challenge.potTotal + challenge.entryFee;
    const newCount = challenge.participants.length + 1;

    const isFull = newCount >= challenge.maxPlayers;

    await this.prisma.challenge.update({
      where: { id: challengeId },
      data: {
        potTotal: newPot,
        ...(isFull ? { status: 'FULL' as any } : {}),
      },
    });

    const updated = await this.findOne(challengeId);
    this.notifyChallenge(challengeId, 'challenge_update', { challengeId, status: updated.status, participants: updated.participants });

    if (isFull) {
      setTimeout(() => this.startChallenge(challengeId), 3000);
    }

    return updated;
  }

  // ─── START ───────────────────────────────────────────────────────────────────

  async startChallenge(challengeId: string) {
    const challenge = await this.prisma.challenge.update({
      where: { id: challengeId },
      data: { status: 'IN_PROGRESS' as any, startedAt: new Date() },
      include: { participants: { select: { userId: true } } },
    });

    this.notifyChallenge(challengeId, 'challenge_started', { challengeId });

    // Créer automatiquement le salon de discussion du défi
    try {
      const participantIds = challenge.participants.map((p) => p.userId);
      const conv = await this.chatService.createChallengeConversation(challengeId, participantIds);
      this.notifyChallenge(challengeId, 'challenge_chat_ready', {
        challengeId,
        conversationId: conv.id,
      });
    } catch (err) {
      // Non-bloquant : le chat de défi est optionnel
      console.error('[ChallengesService] Failed to create challenge conversation:', err.message);
    }
  }

  // ─── SUBMIT RESULT ───────────────────────────────────────────────────────────

  async submitResult(
    challengeId: string,
    userId: string,
    rank: number,
    screenshotUrl?: string,
  ) {
    const challenge = await this.findOne(challengeId);

    if (challenge.status !== 'IN_PROGRESS' && challenge.status !== 'VALIDATING') {
      throw new BadRequestException('Le défi n\'est pas en cours');
    }

    const isParticipant = challenge.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw new ForbiddenException('Tu n\'es pas participant à ce défi');

    const alreadySubmitted = challenge.results.some((r) => r.userId === userId);
    if (alreadySubmitted) throw new BadRequestException('Tu as déjà soumis un résultat');

    await this.prisma.challengeResult.create({
      data: { challengeId, userId, declaredRank: rank, screenshotUrl },
    });

    await this.prisma.challenge.update({
      where: { id: challengeId },
      data: { status: 'VALIDATING' as any },
    });

    const updatedChallenge = await this.findOne(challengeId);
    if (updatedChallenge.results.length >= updatedChallenge.participants.length) {
      await this.checkConsensus(challengeId);
    }

    return updatedChallenge;
  }

  // ─── CHECK CONSENSUS ─────────────────────────────────────────────────────────

  async checkConsensus(challengeId: string) {
    const challenge = await this.findOne(challengeId);
    const ranks = challenge.results.map((r) => r.declaredRank).sort((a, b) => a - b);
    const uniqueRanks = new Set(ranks);

    const hasConsensus = uniqueRanks.size === ranks.length;

    if (hasConsensus) {
      await this.distributeWinnings(challengeId);
    } else {
      await this.createDispute(challengeId, 'Résultats contradictoires entre les joueurs');
    }
  }

  // ─── DISTRIBUTE WINNINGS ─────────────────────────────────────────────────────

  async distributeWinnings(challengeId: string) {
    const challenge = await this.findOne(challengeId);

    const commission = Math.floor(challenge.potTotal * challenge.commission);
    const netPot = challenge.potTotal - commission;

    // Credit commission to first admin
    const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
      await this.walletService.credit(admin.id, commission, 'COMMISSION', `Commission défi: ${challenge.title}`);
    }

    // Sort results by rank
    const sorted = [...challenge.results].sort((a, b) => a.declaredRank - b.declaredRank);

    const prizes: Record<number, number> = {
      1: Math.floor(netPot * PRIZE_DISTRIBUTION.FIRST),
      2: Math.floor(netPot * PRIZE_DISTRIBUTION.SECOND),
      3: Math.floor(netPot * PRIZE_DISTRIBUTION.THIRD),
    };

    const participantIds = challenge.participants.map((p) => p.userId);

    for (const result of sorted) {
      const winnings = prizes[result.declaredRank] ?? 0;

      if (winnings > 0) {
        await this.walletService.credit(
          result.userId,
          winnings,
          'CHALLENGE_WIN',
          `Gain défi ${result.declaredRank === 1 ? '🥇' : result.declaredRank === 2 ? '🥈' : '🥉'}: ${challenge.title}`,
        );
      }

      await this.prisma.challengeParticipant.update({
        where: { challengeId_userId: { challengeId, userId: result.userId } },
        data: { rank: result.declaredRank, winnings },
      });

      // Notifications
      await this.prisma.notification.create({
        data: {
          userId: result.userId,
          type: winnings > 0 ? ('CHALLENGE_WON' as any) : ('CHALLENGE_LOST' as any),
          title: winnings > 0 ? `🏆 Tu as gagné ${winnings.toLocaleString('fr-FR')} CFA !` : 'Défi terminé',
          body: winnings > 0
            ? `Tu as terminé ${result.declaredRank === 1 ? '1er' : result.declaredRank === 2 ? '2ème' : '3ème'} dans "${challenge.title}"`
            : `Tu n'as pas remporté de gains dans "${challenge.title}"`,
          data: { challengeId },
        },
      });

      // Update stats
      await this.prisma.user.update({
        where: { id: result.userId },
        data: {
          gamesPlayed: { increment: 1 },
          ...(result.declaredRank === 1 ? { gamesWon: { increment: 1 } } : {}),
        },
      });
    }

    // Notify participants who didn't submit
    for (const userId of participantIds) {
      if (!sorted.find((r) => r.userId === userId)) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { gamesPlayed: { increment: 1 } },
        });
      }
    }

    await this.prisma.challenge.update({
      where: { id: challengeId },
      data: { status: 'COMPLETED' as any, endedAt: new Date() },
    });

    const final = await this.findOne(challengeId);
    this.notifyChallenge(challengeId, 'challenge_completed', { challengeId, results: final.results });
    return final;
  }

  // ─── CREATE DISPUTE ──────────────────────────────────────────────────────────

  async createDispute(challengeId: string, reason: string) {
    const challenge = await this.findOne(challengeId);

    await this.prisma.challengeDispute.create({
      data: { challengeId, reason },
    });

    await this.prisma.challenge.update({
      where: { id: challengeId },
      data: { status: 'DISPUTED' as any },
    });

    // Notify all participants
    for (const p of challenge.participants) {
      await this.prisma.notification.create({
        data: {
          userId: p.userId,
          type: 'CHALLENGE_DISPUTED' as any,
          title: 'Litige en cours',
          body: `Un litige a été ouvert pour le défi "${challenge.title}". L'admin va trancher.`,
          data: { challengeId },
        },
      });
    }

    this.notifyChallenge(challengeId, 'challenge_disputed', { challengeId, reason });
  }

  async forceDispute(challengeId: string, userId: string, reason: string) {
    const challenge = await this.findOne(challengeId);

    const isParticipant = challenge.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw new ForbiddenException('Tu n\'es pas participant à ce défi');

    if (challenge.dispute) throw new BadRequestException('Un litige existe déjà');

    await this.createDispute(challengeId, reason);
    return this.findOne(challengeId);
  }

  // ─── RESOLVE DISPUTE ─────────────────────────────────────────────────────────

  async resolveDispute(
    disputeId: string,
    winnerId: string,
    adminNote: string,
    adminId: string,
  ) {
    const dispute = await this.prisma.challengeDispute.findUnique({
      where: { id: disputeId },
    });
    if (!dispute) throw new NotFoundException('Litige introuvable');

    // Force result: set rank=1 for winner and rank=2 for others
    const challenge = await this.findOne(dispute.challengeId);
    let rank = 2;
    for (const p of challenge.participants) {
      await this.prisma.challengeResult.upsert({
        where: { challengeId_userId: { challengeId: dispute.challengeId, userId: p.userId } },
        create: {
          challengeId: dispute.challengeId,
          userId: p.userId,
          declaredRank: p.userId === winnerId ? 1 : rank++,
        },
        update: { declaredRank: p.userId === winnerId ? 1 : rank++ },
      });
    }

    await this.prisma.challengeDispute.update({
      where: { id: disputeId },
      data: { status: 'RESOLVED', adminNote, resolvedBy: adminId, resolvedAt: new Date() },
    });

    await this.distributeWinnings(dispute.challengeId);

    // Notify participants
    for (const p of challenge.participants) {
      await this.prisma.notification.create({
        data: {
          userId: p.userId,
          type: 'CHALLENGE_RESOLVED' as any,
          title: 'Litige résolu',
          body: `Le litige pour le défi "${challenge.title}" a été résolu par un admin.`,
          data: { challengeId: dispute.challengeId },
        },
      });
    }

    return this.findOne(dispute.challengeId);
  }

  // ─── MY CHALLENGES ───────────────────────────────────────────────────────────

  async getMyChallenges(userId: string) {
    const [created, participated] = await Promise.all([
      this.prisma.challenge.findMany({
        where: { creatorId: userId },
        include: { _count: { select: { participants: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.challenge.findMany({
        where: { participants: { some: { userId } } },
        include: { _count: { select: { participants: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { created, participated };
  }

  // ─── ADMIN DISPUTES ──────────────────────────────────────────────────────────

  async getDisputes(status?: string) {
    return this.prisma.challengeDispute.findMany({
      where: status ? { status: status as any } : { status: 'PENDING' },
      include: {
        challenge: {
          include: {
            participants: { select: PARTICIPANT_SELECT },
            results: {
              include: {
                user: { select: { id: true, username: true, avatar: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDisputeById(id: string) {
    const dispute = await this.prisma.challengeDispute.findUnique({
      where: { id },
      include: {
        challenge: {
          include: {
            participants: { select: PARTICIPANT_SELECT },
            results: {
              include: {
                user: { select: { id: true, username: true, avatar: true } },
              },
            },
          },
        },
      },
    });
    if (!dispute) throw new NotFoundException('Litige introuvable');
    return dispute;
  }

  // ─── DELETE CHALLENGE ─────────────────────────────────────────────────────────

  async deleteChallenge(challengeId: string, userId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { participants: true },
    });

    if (!challenge) {
      throw new NotFoundException('Défi introuvable');
    }

    // Only creator can delete
    if (challenge.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut supprimer ce défi');
    }

    // Can only delete if OPEN (no one else joined yet)
    if (challenge.status !== 'OPEN') {
      throw new BadRequestException('Impossible de supprimer un défi en cours ou terminé');
    }

    // Refund creator if they paid
    const creatorParticipant = challenge.participants.find((p) => p.userId === userId);
    if (creatorParticipant?.hasPaid) {
      await this.walletService.credit(
        userId,
        challenge.entryFee,
        'CHALLENGE_REFUND',
        `Remboursement défi annulé: ${challenge.title}`,
      );
    }

    // Delete participants and challenge
    await this.prisma.challengeParticipant.deleteMany({
      where: { challengeId },
    });

    await this.prisma.challenge.delete({
      where: { id: challengeId },
    });

    return { message: 'Défi supprimé avec succès' };
  }
}
