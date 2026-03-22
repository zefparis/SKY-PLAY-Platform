import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    return user?.wallet;
  }

  async getTransactions(userId: string) {
    const wallet = await this.getWallet(userId);
    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    return this.prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async credit(userId: string, amount: number, type: string, description?: string) {
    const wallet = await this.getWallet(userId);
    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      return tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: type as any,
          amount,
          status: 'COMPLETED',
          description,
        },
      });
    });
  }

  async debit(userId: string, amount: number, type: string, description?: string) {
    const wallet = await this.getWallet(userId);
    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      return tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: type as any,
          amount: -amount,
          status: 'COMPLETED',
          description,
        },
      });
    });
  }
}
