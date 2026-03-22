import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { SubmitResultDto } from './dto/match.dto';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async submitResult(matchId: string, userId: string, dto: SubmitResultDto) {
    const result = await this.prisma.matchResult.create({
      data: {
        matchId,
        userId,
        score: dto.score,
        proof: dto.proof,
      },
    });

    return result;
  }

  async distributeWinnings(challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        participants: {
          orderBy: { rank: 'asc' },
        },
      },
    });

    if (!challenge) return;

    const prizePool = Number(challenge.prizePool);
    const commission = prizePool * 0.1;
    const netPrize = prizePool - commission;

    if (challenge.participants.length > 0 && challenge.participants[0].rank === 1) {
      const winner = challenge.participants[0];
      await this.walletService.credit(
        winner.userId,
        netPrize,
        'CHALLENGE_WIN',
        `Won challenge: ${challenge.title}`
      );

      await this.prisma.participant.update({
        where: { id: winner.id },
        data: { prize: netPrize },
      });
    }
  }
}
