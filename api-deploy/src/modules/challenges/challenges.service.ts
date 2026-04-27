import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ChatService } from '../chat/chat.service';
import { LeaguesService } from '../leagues/leagues.service';
import { RekognitionService } from '../rekognition/rekognition.service';
import { CHALLENGE_TYPES, PRIZE_DISTRIBUTION, MANUAL_REVIEW_THRESHOLD, AUTO_APPROVE_DELAY_MS, ALLOWED_GAMES } from './challenges.constants';

const AUTO_VERIFY_CONFIDENCE = 80;
const CONSENSUS_RETRY_DELAY_MS = 5000;

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
  private readonly logger = new Logger(ChallengesService.name);
  private server: any = null; // Set by ChatGateway via setServer()

  /**
   * Best-effort admin log writer — never throws.
   * Audit logs should never block business operations (e.g. FK violation if
   * adminId='SYSTEM' or a Cognito sub that isn't in the users table).
   */
  private async safeAdminLog(data: { adminId: string; action: string; targetId?: string; targetType?: string; details?: any }) {
    try {
      await this.prisma.adminLog.create({ data });
    } catch (e: any) {
      this.logger.warn(
        `AdminLog skipped (action=${data.action}, adminId=${data.adminId}): ${e?.message ?? e}`,
      );
    }
  }

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    @Inject(forwardRef(() => ChatService)) private chatService: ChatService,
    private leagueService: LeaguesService,
    private rekognition: RekognitionService,
  ) {}

  setServer(server: any) {
    this.server = server;
  }

  private notifyChallenge(challengeId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`challenge_${challengeId}`).emit(event, data);
    }
  }

  private emitNotification(userId: string, notif: any) {
    if (this.server) {
      this.server.to(`user_${userId}`).emit('new_notification', notif);
    }
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────────

  async create(userId: string, title: string, game: string, type: string) {
    const config = CHALLENGE_TYPES[type as ChallengeTypeKey];
    if (!config) throw new BadRequestException('Type de défi invalide');
    if (!(ALLOWED_GAMES as readonly string[]).includes(game)) {
      throw new BadRequestException('Ce jeu n\'est pas supporté pour les tournois');
    }

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

    // Create the challenge chat room immediately so participants can coordinate
    // before the challenge actually starts (OPEN/FULL statuses).
    try {
      await this.chatService.createChallengeConversation(challenge.id, [userId]);
    } catch (err) {
      console.error('[ChallengesService] Failed to create challenge conversation on create:', err?.message);
    }

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

    // Add the joiner to the existing challenge chat room (or create it on the fly).
    try {
      await this.chatService.addChallengeConversationMember(challengeId, userId);
    } catch (err) {
      console.error('[ChallengesService] Failed to add member to challenge conversation:', err?.message);
    }

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
      // Notifier chaque participant directement via sa room personnelle (indépendant de la page défi)
      for (const userId of participantIds) {
        if (this.server) {
          this.server.to(`user_${userId}`).emit('challenge_chat_ready', {
            challengeId,
            conversationId: conv.id,
          });
        }
      }
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

    if (screenshotUrl) {
      const isValidS3 = /^https:\/\/.+\.amazonaws\.com\/.+/.test(screenshotUrl);
      if (!isValidS3) {
        throw new BadRequestException('Screenshot doit être uploadé via /upload/screenshot');
      }
    }

    const result = await this.prisma.challengeResult.create({
      data: {
        challengeId,
        userId,
        declaredRank: rank,
        screenshotUrl,
        analysisStatus: screenshotUrl ? ('ANALYZING' as any) : ('FAILED' as any),
      },
    });

    await this.prisma.challenge.update({
      where: { id: challengeId },
      data: { status: 'VALIDATING' as any },
    });

    const updatedChallenge = await this.findOne(challengeId);

    this.notifyChallenge(challengeId, 'result_submitted', {
      challengeId,
      submittedCount: updatedChallenge.results.length,
      totalPlayers: challenge.maxPlayers,
      submittedBy: userId,
    });

    // Fire-and-forget Rekognition analysis (no await — runs in background)
    if (screenshotUrl) {
      this.analyzeResultAsync(result.id, screenshotUrl, challenge.game).catch((err) =>
        this.logger.error(`Rekognition async failed for result=${result.id}`, err?.stack),
      );
    }

    if (updatedChallenge.results.length >= updatedChallenge.participants.length) {
      await this.checkConsensus(challengeId);
    }

    return updatedChallenge;
  }

  // ─── ANALYZE RESULT (async, fire-and-forget) ────────────────────────────────────

  private async analyzeResultAsync(
    resultId: string,
    screenshotUrl: string,
    game: string,
  ): Promise<void> {
    let s3Key: string;
    try {
      s3Key = this.rekognition.extractS3Key(screenshotUrl);
    } catch (err: any) {
      this.logger.error(`Invalid screenshot URL for result=${resultId}: ${err?.message}`);
      await this.prisma.challengeResult.update({
        where: { id: resultId },
        data: {
          analysisStatus: 'FAILED' as any,
          analyzedAt: new Date(),
          rekognitionData: { error: 'invalid_url', message: err?.message } as any,
        },
      });
      return;
    }

    const analysis = await this.rekognition.analyzeScreenshot(s3Key, game);
    const isHighConfidence =
      analysis.confidence >= AUTO_VERIFY_CONFIDENCE && analysis.verifiedRank !== null;

    const updated = await this.prisma.challengeResult.update({
      where: { id: resultId },
      data: {
        verifiedRank: analysis.verifiedRank,
        verifiedScore: analysis.verifiedScore,
        confidence: analysis.confidence,
        rekognitionData: analysis.rawData as any,
        analyzedAt: new Date(),
        analysisStatus: analysis.status as any,
        dataSource: (isHighConfidence ? 'AUTO_VERIFIED' : 'SCREENSHOT') as any,
      },
    });

    this.notifyChallenge(updated.challengeId, 'analysis_completed', {
      resultId,
      userId: updated.userId,
      verifiedRank: analysis.verifiedRank,
      confidence: analysis.confidence,
      status: analysis.status,
    });
  }

  // ─── CHECK CONSENSUS (hybrid: declared + Rekognition) ───────────────────────────

  async checkConsensus(challengeId: string): Promise<void> {
    const results = await this.prisma.challengeResult.findMany({
      where: { challengeId },
    });

    // Wait until every result has reached a terminal analysis state
    const allAnalyzed = results.every(
      (r) => r.analysisStatus !== 'ANALYZING' && r.analysisStatus !== 'PENDING',
    );

    if (!allAnalyzed) {
      this.logger.log(
        `Consensus deferred for challenge=${challengeId} — ${results.filter((r) => r.analysisStatus === 'ANALYZING' || r.analysisStatus === 'PENDING').length} analyses pending`,
      );
      setTimeout(
        () => this.checkConsensus(challengeId).catch((e) => this.logger.error(e?.message)),
        CONSENSUS_RETRY_DELAY_MS,
      );
      return;
    }

    // Use verified rank when confidence is high enough, otherwise fall back to declared
    const effectiveRanks = results.map((r) => {
      const useVerified =
        r.confidence !== null &&
        r.confidence !== undefined &&
        r.confidence >= AUTO_VERIFY_CONFIDENCE &&
        r.verifiedRank !== null;
      return {
        userId: r.userId,
        rank: useVerified ? (r.verifiedRank as number) : r.declaredRank,
        source: useVerified ? ('AUTO_VERIFIED' as const) : ('DECLARED' as const),
      };
    });

    const uniqueRanks = new Set(effectiveRanks.map((r) => r.rank));
    const hasConsensus = uniqueRanks.size === effectiveRanks.length;

    if (hasConsensus) {
      await this.distributeWinnings(challengeId);
      const autoVerified = effectiveRanks.filter((r) => r.source === 'AUTO_VERIFIED');
      if (autoVerified.length > 0) {
        this.notifyChallenge(challengeId, 'auto_verified', {
          message: 'Résultats vérifiés automatiquement par IA',
          verifiedCount: autoVerified.length,
          totalCount: effectiveRanks.length,
        });
      }
    } else {
      await this.createDispute(
        challengeId,
        'Résultats contradictoires — vérification IA non concluante',
      );
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

    const sorted = [...challenge.results].sort((a, b) => a.declaredRank - b.declaredRank);
    const participantIds = challenge.participants.map((p) => p.userId);

    const prizes: Record<number, number> = {
      1: Math.floor(netPot * PRIZE_DISTRIBUTION.FIRST),
      2: Math.floor(netPot * PRIZE_DISTRIBUTION.SECOND),
      3: Math.floor(netPot * PRIZE_DISTRIBUTION.THIRD),
    };

    for (const result of sorted) {
      const winnings = prizes[result.declaredRank] ?? 0;

      if (winnings > 0) {
        const flaggedDevice = await (this.prisma as any).deviceFingerprint?.findFirst({
          where: { userId: result.userId, isFlagged: true },
        }) ?? null;

        const needsManualReview = winnings >= MANUAL_REVIEW_THRESHOLD || !!flaggedDevice;

        if (needsManualReview) {
          // ─── PENDING_REVIEW : validation admin obligatoire ────────────────
          await (this.prisma.challengeParticipant as any).update({
            where: { challengeId_userId: { challengeId, userId: result.userId } },
            data: { rank: result.declaredRank, winnings, winningsStatus: 'PENDING_REVIEW' },
          });
          await this.safeAdminLog({
            adminId: 'SYSTEM',
            action: 'WINNINGS_PENDING_REVIEW',
            targetId: result.userId,
            targetType: 'USER',
            details: {
              challengeId,
              winnings,
              rank: result.declaredRank,
              reason: flaggedDevice ? 'DEVICE_FLAGGED' : 'AMOUNT_THRESHOLD',
            },
          });
          const notifReview = await this.prisma.notification.create({
            data: {
              userId: result.userId,
              type: 'WINNINGS_REVIEW' as any,
              title: '🏆 Tu as gagné !',
              body: `Ton gain de ${winnings.toLocaleString('fr-FR')} SKY est en cours de validation (24h max). Tu seras notifié dès la validation.`,
              data: { challengeId, winnings },
            },
          });
          this.emitNotification(result.userId, notifReview);
        } else {
          // ─── AUTO_APPROVED : crédit après délai de 30 min ────────────────
          const winningsReviewAt = new Date(Date.now() + AUTO_APPROVE_DELAY_MS);
          await (this.prisma.challengeParticipant as any).update({
            where: { challengeId_userId: { challengeId, userId: result.userId } },
            data: {
              rank: result.declaredRank,
              winnings,
              winningsStatus: 'AUTO_APPROVED',
              winningsReviewAt,
            },
          });
          const notifWon = await this.prisma.notification.create({
            data: {
              userId: result.userId,
              type: 'CHALLENGE_WON' as any,
              title: `🏆 Tu as gagné ${winnings.toLocaleString('fr-FR')} SKY !`,
              body: `Tu as terminé ${result.declaredRank === 1 ? '1er' : result.declaredRank === 2 ? '2ème' : '3ème'} dans "${challenge.title}". Tes gains seront crédités dans 30 min.`,
              data: { challengeId, winnings, winningsReviewAt },
            },
          });
          this.emitNotification(result.userId, notifWon);
        }
      } else {
        // ─── Pas de gains ─────────────────────────────────────────────────
        await (this.prisma.challengeParticipant as any).update({
          where: { challengeId_userId: { challengeId, userId: result.userId } },
          data: { rank: result.declaredRank, winnings: 0, winningsStatus: 'PAID' },
        });
        const notifLost = await this.prisma.notification.create({
          data: {
            userId: result.userId,
            type: 'CHALLENGE_LOST' as any,
            title: 'Défi terminé',
            body: `Tu n'as pas remporté de gains dans "${challenge.title}"`,
            data: { challengeId },
          },
        });
        this.emitNotification(result.userId, notifLost);
      }

      const xpGain = ({ 1: 100, 2: 50, 3: 25 } as Record<number, number>)[result.declaredRank] ?? 10;
      const updatedUser = await this.prisma.user.update({
        where: { id: result.userId },
        data: {
          gamesPlayed: { increment: 1 },
          xp: { increment: xpGain },
          ...(result.declaredRank === 1 ? { gamesWon: { increment: 1 } } : {}),
        },
        select: { xp: true, level: true },
      });
      const newLevel = Math.floor(updatedUser.xp / 200) + 1;
      if (newLevel !== updatedUser.level) {
        await this.prisma.user.update({ where: { id: result.userId }, data: { level: newLevel } });
      }
      const leaguePoints = ({ 1: 100, 2: 50, 3: 25 } as Record<number, number>)[result.declaredRank] ?? 10;
      this.leagueService.awardLeaguePoints(result.userId, challenge.game, leaguePoints).catch(() => {});
    }

    for (const userId of participantIds) {
      if (!sorted.find((r) => r.userId === userId)) {
        const u = await this.prisma.user.update({
          where: { id: userId },
          data: { gamesPlayed: { increment: 1 }, xp: { increment: 5 } },
          select: { xp: true, level: true },
        });
        const lvl = Math.floor(u.xp / 200) + 1;
        if (lvl !== u.level) {
          await this.prisma.user.update({ where: { id: userId }, data: { level: lvl } });
        }
      }
    }

    await this.prisma.challenge.update({
      where: { id: challengeId },
      data: { status: 'COMPLETED' as any, endedAt: new Date() },
    });

    const final = await this.findOne(challengeId);
    this.notifyChallenge(challengeId, 'challenge_completed', { challengeId, results: final.results });

    // Fermer le salon de discussion du défi (message système + challenge_chat_closed après 8s)
    try {
      await this.chatService.closeChallengeConversation(challengeId);
    } catch (err) {
      console.error('[ChallengesService] Failed to close challenge conversation:', err.message);
    }

    return final;
  }

  // ─── PROCESS AUTO-APPROVED WINNINGS (job toutes les 5 min) ───────────────────

  async processAutoApprovedWinnings() {
    const ready = await (this.prisma.challengeParticipant as any).findMany({
      where: {
        winningsStatus: 'AUTO_APPROVED',
        winningsReviewAt: { lte: new Date() },
        winnings: { gt: 0 },
      },
      include: {
        challenge: { select: { title: true } },
        user: { select: { id: true, username: true } },
      },
    });

    for (const participant of ready) {
      await this.walletService.credit(
        participant.userId,
        participant.winnings!,
        'CHALLENGE_WIN',
        `Gain défi: ${participant.challenge.title}`,
      );
      await (this.prisma.challengeParticipant as any).update({
        where: { id: participant.id },
        data: { winningsStatus: 'PAID', winningsApprovedAt: new Date() },
      });
      const notifCredit = await this.prisma.notification.create({
        data: {
          userId: participant.userId,
          type: 'CHALLENGE_WON' as any,
          title: '✅ Gains crédités !',
          body: `${participant.winnings!.toLocaleString('fr-FR')} SKY ont été crédités sur ton compte.`,
          data: { challengeId: participant.challengeId, winnings: participant.winnings },
        },
      });
      this.emitNotification(participant.userId, notifCredit);
    }

    return { processed: ready.length };
  }

  // ─── WINNINGS ADMIN REVIEW ────────────────────────────────────────────────────

  async getWinningsPending() {
    return (this.prisma.challengeParticipant as any).findMany({
      where: { winningsStatus: 'PENDING_REVIEW' },
      include: {
        challenge: { select: { id: true, title: true, game: true } },
        user: {
          select: {
            id: true, username: true, email: true, avatar: true, kycStatus: true,
            deviceFingerprints: { where: { isFlagged: true }, select: { id: true } },
          },
        },
        // include screenshot via ChallengeResult
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  async approveWinnings(participantId: string, adminId: string) {
    const participant = await this.prisma.challengeParticipant.findUnique({
      where: { id: participantId },
      include: { challenge: { select: { title: true } } },
    });
    if (!participant) throw new NotFoundException('Participant introuvable');
    if ((participant as any).winningsStatus !== 'PENDING_REVIEW') {
      throw new BadRequestException('Ce gain n\'est pas en attente de validation');
    }

    await this.walletService.credit(
      participant.userId,
      participant.winnings!,
      'CHALLENGE_WIN',
      `Gain validé par admin: ${participant.challenge.title}`,
    );
    await (this.prisma.challengeParticipant as any).update({
      where: { id: participantId },
      data: { winningsStatus: 'PAID', winningsApprovedAt: new Date() },
    });
    await this.safeAdminLog({
      adminId,
      action: 'WINNINGS_APPROVED',
      targetId: participant.userId,
      targetType: 'USER',
      details: { participantId, winnings: participant.winnings, challengeId: participant.challengeId },
    });
    const notifApproved = await this.prisma.notification.create({
      data: {
        userId: participant.userId,
        type: 'CHALLENGE_WON' as any,
        title: '✅ Gains validés et crédités !',
        body: `Tes gains de ${participant.winnings!.toLocaleString('fr-FR')} SKY ont été validés et crédités sur ton compte.`,
        data: { challengeId: participant.challengeId, winnings: participant.winnings },
      },
    });
    this.emitNotification(participant.userId, notifApproved);
    return { approved: true, winnings: participant.winnings };
  }

  async rejectWinnings(participantId: string, reason: string, adminId: string) {
    const participant = await this.prisma.challengeParticipant.findUnique({
      where: { id: participantId },
      include: { challenge: { select: { title: true } } },
    });
    if (!participant) throw new NotFoundException('Participant introuvable');

    await (this.prisma.challengeParticipant as any).update({
      where: { id: participantId },
      data: {
        winningsStatus: 'REJECTED',
        winningsRejectedAt: new Date(),
        winningsRejectReason: reason,
      },
    });
    await this.safeAdminLog({
      adminId,
      action: 'WINNINGS_REJECTED',
      targetId: participant.userId,
      targetType: 'USER',
      details: { participantId, winnings: participant.winnings, reason, challengeId: participant.challengeId },
    });
    const notifRejected = await this.prisma.notification.create({
      data: {
        userId: participant.userId,
        type: 'WINNINGS_REVIEW' as any,
        title: '❌ Validation refusée',
        body: `Tes gains de ${participant.winnings!.toLocaleString('fr-FR')} SKY n'ont pas été validés. Raison : ${reason}. Contactez support@skyplay.cm.`,
        data: { challengeId: participant.challengeId, reason },
      },
    });
    this.emitNotification(participant.userId, notifRejected);
    return { rejected: true, reason };
  }

  // ─── CANCEL CHALLENGE (admin) + REMBOURSEMENT ─────────────────────────────────

  async cancelChallenge(challengeId: string, reason: string, adminId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { participants: { where: { hasPaid: true } } },
    });
    if (!challenge) throw new NotFoundException('Défi introuvable');
    if (challenge.status === 'CANCELLED') throw new BadRequestException('Défi déjà annulé');

    let refundCount = 0;
    for (const participant of challenge.participants) {
      await this.walletService.credit(
        participant.userId,
        challenge.entryFee,
        'REFUND' as any,
        `Remboursement — ${reason}`,
      );
      const notifRefund = await this.prisma.notification.create({
        data: {
          userId: participant.userId,
          type: 'REFUND' as any,
          title: '💸 Remboursement effectué',
          body: `${challenge.entryFee.toLocaleString('fr-FR')} SKY remboursés suite à : ${reason}`,
          data: { challengeId, amount: challenge.entryFee },
        },
      });
      this.emitNotification(participant.userId, notifRefund);
      refundCount++;
    }

    await this.prisma.challenge.update({
      where: { id: challengeId },
      data: { status: 'CANCELLED' as any },
    });

    if (adminId !== 'SYSTEM') {
      await this.safeAdminLog({
        adminId,
        action: 'CHALLENGE_CANCELLED',
        targetId: challengeId,
        targetType: 'CHALLENGE',
        details: { reason, refundCount, entryFee: challenge.entryFee },
      });
    }

    return { cancelled: true, refundCount };
  }

  // ─── CREATOR CANCEL (avant tout autre participant) ────────────────────────────

  async creatorCancelChallenge(challengeId: string, userId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { participants: true },
    });
    if (!challenge) throw new NotFoundException('Défi introuvable');
    if (challenge.creatorId !== userId) throw new ForbiddenException('Seul le créateur peut annuler ce défi');
    if (challenge.status !== 'OPEN') throw new BadRequestException('Impossible d\'annuler un défi en cours ou terminé');

    const otherParticipants = challenge.participants.filter((p) => p.userId !== userId);
    if (otherParticipants.length > 0) {
      throw new BadRequestException('Impossible d\'annuler un défi avec des participants');
    }

    return this.cancelChallenge(challengeId, 'Annulé par le créateur', 'SYSTEM');
  }

  // ─── PROCESS EXPIRED CHALLENGES (job toutes les heures) ───────────────────────

  async processExpiredChallenges() {
    const expired = await this.prisma.challenge.findMany({
      where: {
        status: 'OPEN',
        expiresAt: { lte: new Date() },
      },
      select: { id: true, title: true },
    });

    for (const challenge of expired) {
      await this.cancelChallenge(
        challenge.id,
        'Défi expiré — nombre de joueurs insuffisant',
        'SYSTEM',
      );
    }

    return { processed: expired.length };
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
      const notifDisputed = await this.prisma.notification.create({
        data: {
          userId: p.userId,
          type: 'CHALLENGE_DISPUTED' as any,
          title: 'Litige en cours',
          body: `Un litige a été ouvert pour le défi "${challenge.title}". L'admin va trancher.`,
          data: { challengeId },
        },
      });
      this.emitNotification(p.userId, notifDisputed);
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
      const notifResolved = await this.prisma.notification.create({
        data: {
          userId: p.userId,
          type: 'CHALLENGE_RESOLVED' as any,
          title: 'Litige résolu',
          body: `Le litige pour le défi "${challenge.title}" a été résolu par un admin.`,
          data: { challengeId: dispute.challengeId },
        },
      });
      this.emitNotification(p.userId, notifResolved);
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

  // ─── SET MATCH STREAM ────────────────────────────────────────────────────────

  async setMatchStream(matchId: string, userId: string, streamUrl: string) {
    const match = await (this.prisma as any).tournamentMatch.findUnique({
      where: { id: matchId },
      include: {
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
      },
    });
    if (!match) throw new NotFoundException('Match introuvable');
    if (match.player1.id !== userId && match.player2.id !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas participant à ce match');
    }

    let streamType: string;
    if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')) {
      streamType = 'YOUTUBE';
    } else if (streamUrl.includes('twitch.tv')) {
      streamType = 'TWITCH';
    } else if (streamUrl.includes('facebook.com')) {
      streamType = 'FACEBOOK';
    } else {
      throw new BadRequestException('URL de stream invalide (YouTube, Twitch ou Facebook)');
    }

    const updated = await (this.prisma as any).tournamentMatch.update({
      where: { id: matchId },
      data: { streamUrl, streamType },
    });

    const playerName = match.player1.id === userId ? match.player1.username : match.player2.username;

    if (match.challengeId) {
      const payload = {
        matchId,
        streamUrl,
        streamType,
        playerName,
        challengeId: match.challengeId,
      };
      this.notifyChallenge(match.challengeId, 'stream_started', payload);

      // Broadcast also into the challenge's chat conversation so users in the
      // chat sidebar see the stream banner without joining the challenge page.
      try {
        const conv = await (this.prisma as any).conversation.findUnique({
          where: { challengeId: match.challengeId },
          select: { id: true },
        });
        if (conv && this.server) {
          this.server.to(`conv_${conv.id}`).emit('stream_started', {
            ...payload,
            conversationId: conv.id,
          });
        }
      } catch {}
    }

    return updated;
  }

  // ─── CHALLENGE CALENDAR (round-robin) ─────────────────────────────────────────

  async getChallengeCalendar(challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        participants: { select: { userId: true, user: { select: { id: true, username: true, avatar: true } } } },
        matches: {
          include: {
            player1: { select: { id: true, username: true, avatar: true } },
            player2: { select: { id: true, username: true, avatar: true } },
          },
          orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
        },
      } as any,
    });
    if (!challenge) throw new NotFoundException('Défi introuvable');

    const challengeAny = challenge as any;
    const participants = challengeAny.participants.map((p: any) => p.user);

    // Look up the chat conversation for this challenge so the frontend can
    // deep-link into the chat room from the calendar "Jouer" button.
    const conversation = await this.prisma.conversation.findUnique({
      where: { challengeId },
      select: { id: true },
    });
    const conversationId = conversation?.id ?? null;

    if (participants.length < 2) {
      return { rounds: [], participants: participants.length, title: challenge.title, game: challenge.game, type: challenge.type, conversationId };
    }

    // Generate matches if none exist
    if ((challengeAny.matches?.length ?? 0) === 0) {
      await this.generateChallengeMatches(challengeId, participants);
      // Reload
      const refreshed = await this.prisma.challenge.findUnique({
        where: { id: challengeId },
        include: {
          matches: {
            include: {
              player1: { select: { id: true, username: true, avatar: true } },
              player2: { select: { id: true, username: true, avatar: true } },
            },
            orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
          },
        } as any,
      });
      if (refreshed) challengeAny.matches = (refreshed as any).matches ?? [];
    }

    const now = new Date();
    const enriched = (challengeAny.matches ?? []).map((m: any) => ({
      id: m.id,
      challengeId,
      round: m.round,
      player1: m.player1,
      player2: m.player2,
      status: m.status,
      deadlineAt: m.deadlineAt,
      walkedOver: m.walkedOver,
      streamUrl: m.streamUrl,
      streamType: m.streamType,
      matchLink: `/challenges/${challengeId}`,
      timeRemaining: m.deadlineAt
        ? Math.max(0, Math.floor((new Date(m.deadlineAt).getTime() - now.getTime()) / 1000))
        : null,
    }));

    const grouped: Record<number, any[]> = {};
    for (const m of enriched) {
      const round = m.round ?? 1;
      if (!grouped[round]) grouped[round] = [];
      grouped[round].push(m);
    }

    const rounds = Object.entries(grouped)
      .map(([round, matches]) => ({ round: parseInt(round, 10), matches }))
      .sort((a, b) => a.round - b.round);

    return { rounds, participants: participants.length, title: challenge.title, game: challenge.game, type: challenge.type, conversationId };
  }

  private async generateChallengeMatches(challengeId: string, players: { id: string; username: string; avatar?: string | null }[]) {
    const n = players.length;
    // Circle method for round-robin aller-simple
    const ids = players.map((p) => p.id);
    const rounds: Array<[string, string][]> = [];

    if (n % 2 === 1) {
      ids.push('BYE');
    }
    const total = ids.length;

    for (let r = 0; r < total - 1; r++) {
      const roundMatches: [string, string][] = [];
      for (let i = 0; i < total / 2; i++) {
        const a = ids[i];
        const b = ids[total - 1 - i];
        if (a !== 'BYE' && b !== 'BYE') {
          roundMatches.push([a, b]);
        }
      }
      rounds.push(roundMatches);
      // Rotate (keep first fixed, rotate rest)
      ids.splice(1, 0, ids.pop()!);
    }

    const deadlineAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    for (let r = 0; r < rounds.length; r++) {
      for (const [p1, p2] of rounds[r]) {
        await (this.prisma as any).tournamentMatch.create({
          data: {
            challengeId,
            phase: 'CHAMPIONSHIP_ROUND',
            round: r + 1,
            player1Id: p1,
            player2Id: p2,
            status: 'PENDING',
            deadlineAt,
          },
        });
      }
    }
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
