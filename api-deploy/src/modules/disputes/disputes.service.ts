import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ChallengeStatus,
  DisputeStatus,
  TransactionType,
  WinningsStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import {
  DisputeResolution,
  ResolveDisputeDto,
} from './dto/resolve-dispute.dto';

/**
 * Resolves admin-side disputes attached to a Challenge.
 *
 * Notes on atomicity:
 *  - `WalletService.credit` runs its own `prisma.$transaction` (wallet update +
 *    transaction row). Nesting it inside another `$transaction` would not share
 *    the inner client, so we run wallet credits first (each individually
 *    atomic), then perform the final state update (challenge + participants +
 *    dispute) inside a single `$transaction`.
 *  - The dispute is marked `RESOLVED` only after every credit succeeded, so a
 *    failed credit leaves the dispute `PENDING` and the operation is safely
 *    retryable. The initial status check enforces idempotency.
 */
@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  async getPending() {
    return this.prisma.challengeDispute.findMany({
      where: { status: DisputeStatus.PENDING },
      include: {
        challenge: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, username: true, avatar: true } },
              },
              orderBy: { joinedAt: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getById(id: string) {
    const dispute = await this.prisma.challengeDispute.findUnique({
      where: { id },
      include: {
        challenge: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, username: true, avatar: true } },
              },
              orderBy: { joinedAt: 'asc' },
            },
            results: true,
          },
        },
      },
    });
    if (!dispute) throw new NotFoundException(`Dispute ${id} introuvable`);
    return dispute;
  }

  async resolveDispute(
    id: string,
    adminId: string,
    dto: ResolveDisputeDto,
  ): Promise<{ resolved: true; resolution: DisputeResolution }> {
    const dispute = await this.getById(id);

    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException('Ce litige est déjà résolu');
    }

    const challenge = dispute.challenge;
    const participants = challenge.participants;

    if (participants.length === 0) {
      throw new BadRequestException(
        'Challenge sans participant — impossible à résoudre',
      );
    }

    const entryFee = Number(challenge.entryFee ?? 0);
    const prizePool =
      Number(challenge.potTotal ?? 0) || entryFee * participants.length;

    const isDuel = participants.length === 2;
    const player1 = participants[0];
    const player2 = participants[1];

    if (
      !isDuel &&
      (dto.resolution === DisputeResolution.PLAYER1_WINS ||
        dto.resolution === DisputeResolution.PLAYER2_WINS)
    ) {
      throw new BadRequestException(
        'PLAYER1_WINS / PLAYER2_WINS sont réservés aux challenges en duel (2 joueurs).',
      );
    }

    this.logger.log(
      `Resolving dispute ${id} on challenge ${challenge.id} ` +
        `(participants=${participants.length}, prizePool=${prizePool}, ` +
        `entryFee=${entryFee}) — resolution=${dto.resolution}`,
    );

    // ─── 1) Pay out (each credit is atomic on its own) ──────────────────────
    const winnerId: string | null = await this.payout(
      dto.resolution,
      challenge.id,
      player1?.userId,
      player2?.userId,
      participants.map((p) => p.userId),
      prizePool,
      entryFee,
    );

    // ─── 2) Final state update — atomic ─────────────────────────────────────
    await this.prisma.$transaction(async (tx) => {
      const finalStatus =
        dto.resolution === DisputeResolution.REFUND_BOTH ||
        dto.resolution === DisputeResolution.CANCEL
          ? ChallengeStatus.CANCELLED
          : ChallengeStatus.COMPLETED;

      await tx.challenge.update({
        where: { id: challenge.id },
        data: { status: finalStatus, endedAt: new Date() },
      });

      if (winnerId) {
        await tx.challengeParticipant.updateMany({
          where: { challengeId: challenge.id, userId: winnerId },
          data: {
            rank: 1,
            winnings: prizePool,
            winningsStatus: WinningsStatus.APPROVED,
            winningsApprovedAt: new Date(),
          },
        });
        await tx.challengeParticipant.updateMany({
          where: {
            challengeId: challenge.id,
            userId: { not: winnerId },
          },
          data: {
            rank: 2,
            winnings: 0,
            winningsStatus: WinningsStatus.REJECTED,
            winningsRejectedAt: new Date(),
            winningsRejectReason: 'Lost dispute resolution',
          },
        });
      }

      await tx.challengeDispute.update({
        where: { id },
        data: {
          status: DisputeStatus.RESOLVED,
          resolvedBy: adminId,
          resolvedAt: new Date(),
          adminNote: dto.adminNote ?? null,
        },
      });
    });

    this.logger.log(
      `Dispute ${id} resolved (${dto.resolution}) by admin ${adminId}`,
    );
    return { resolved: true, resolution: dto.resolution };
  }

  /**
   * Performs the wallet credits required by a resolution and returns the
   * winnerId (if any) so the caller can update participant ranks.
   */
  private async payout(
    resolution: DisputeResolution,
    challengeId: string,
    player1Id: string | undefined,
    player2Id: string | undefined,
    allParticipantIds: string[],
    prizePool: number,
    entryFee: number,
  ): Promise<string | null> {
    switch (resolution) {
      case DisputeResolution.PLAYER1_WINS: {
        if (!player1Id) {
          throw new BadRequestException('Player 1 introuvable');
        }
        if (prizePool > 0) {
          await this.wallet.credit(
            player1Id,
            prizePool,
            TransactionType.CHALLENGE_WIN,
            `Victoire litige — Challenge ${challengeId}`,
          );
        }
        return player1Id;
      }

      case DisputeResolution.PLAYER2_WINS: {
        if (!player2Id) {
          throw new BadRequestException('Player 2 introuvable');
        }
        if (prizePool > 0) {
          await this.wallet.credit(
            player2Id,
            prizePool,
            TransactionType.CHALLENGE_WIN,
            `Victoire litige — Challenge ${challengeId}`,
          );
        }
        return player2Id;
      }

      case DisputeResolution.REFUND_BOTH: {
        if (entryFee > 0) {
          for (const userId of allParticipantIds) {
            await this.wallet.credit(
              userId,
              entryFee,
              TransactionType.REFUND,
              `Remboursement litige — Challenge ${challengeId}`,
            );
          }
        }
        return null;
      }

      case DisputeResolution.CANCEL:
        // No payout — just close the challenge & dispute.
        return null;

      default:
        throw new BadRequestException(`Résolution inconnue: ${resolution}`);
    }
  }
}
