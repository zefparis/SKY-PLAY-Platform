import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateChallengeDto } from './dto/challenge.dto';

@Injectable()
export class ChallengesService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async create(dto: CreateChallengeDto) {
    return this.prisma.challenge.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.challenge.findMany({
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.challenge.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async join(challengeId: string, userId: string) {
    const challenge = await this.findOne(challengeId);
    
    if (!challenge) {
      throw new BadRequestException('Challenge not found');
    }

    if (challenge.status !== 'OPEN') {
      throw new BadRequestException('Challenge is not open');
    }

    const participantCount = challenge.participants.length;
    if (participantCount >= challenge.maxPlayers) {
      throw new BadRequestException('Challenge is full');
    }

    const alreadyJoined = challenge.participants.some(p => p.userId === userId);
    if (alreadyJoined) {
      throw new BadRequestException('Already joined this challenge');
    }

    await this.walletService.debit(userId, Number(challenge.entryFee), 'CHALLENGE_ENTRY', `Joined challenge: ${challenge.title}`);

    const participant = await this.prisma.participant.create({
      data: {
        challengeId,
        userId,
        status: 'JOINED',
      },
    });

    if (participantCount + 1 >= challenge.maxPlayers) {
      await this.prisma.challenge.update({
        where: { id: challengeId },
        data: { status: 'FULL' },
      });
    }

    return participant;
  }
}
