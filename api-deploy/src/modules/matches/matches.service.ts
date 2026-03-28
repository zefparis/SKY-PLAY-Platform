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

  private async distributePrizes(challengeId: string) {
    // Temporairement désactivé - à réimplémenter avec le nouveau système de challenges
    console.log('Prize distribution not yet implemented for new challenge system');
    return;
  }
}
