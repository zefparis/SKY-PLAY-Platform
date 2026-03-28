import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, TransactionType, TransactionStatus, ChallengeStatus } from '@prisma/client';
import { 
  GetUsersQueryDto, 
  UpdateUserDto, 
  BanUserDto, 
  AdjustWalletDto, 
  ForceResultDto,
  CancelChallengeDto,
  GetStatsQueryDto,
  GetTransactionsQueryDto,
  GetLogsQueryDto,
  ResolveDisputeDto
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private async createAdminLog(adminId: string, action: string, targetId?: string, targetType?: string, details?: any) {
    await this.prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetId,
        targetType,
        details,
      },
    });
  }

  async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      onlineUsers,
      newToday,
      newThisWeek,
      bannedUsers,
      totalChallenges,
      activeChallenges,
      completedChallenges,
      disputedChallenges,
      cancelledToday,
      allTransactions,
      todayTransactions,
      weekTransactions,
      monthTransactions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ONLINE' } }),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { isBanned: true } }),
      this.prisma.challenge.count(),
      this.prisma.challenge.count({ where: { status: ChallengeStatus.IN_PROGRESS } }),
      this.prisma.challenge.count({ where: { status: ChallengeStatus.COMPLETED } }),
      this.prisma.challenge.count({ where: { status: ChallengeStatus.DISPUTED } }),
      this.prisma.challenge.count({ where: { status: ChallengeStatus.CANCELLED, createdAt: { gte: today } } }),
      this.prisma.transaction.findMany({ where: { type: TransactionType.COMMISSION, status: TransactionStatus.COMPLETED } }),
      this.prisma.transaction.findMany({ where: { type: TransactionType.COMMISSION, status: TransactionStatus.COMPLETED, createdAt: { gte: today } } }),
      this.prisma.transaction.findMany({ where: { type: TransactionType.COMMISSION, status: TransactionStatus.COMPLETED, createdAt: { gte: weekAgo } } }),
      this.prisma.transaction.findMany({ where: { type: TransactionType.COMMISSION, status: TransactionStatus.COMPLETED, createdAt: { gte: monthAgo } } }),
    ]);

    const sumCommissions = (txs: any[]) => txs.reduce((sum, tx) => sum + Number(tx.amount), 0);

    const [deposits, withdrawals] = await Promise.all([
      this.prisma.transaction.findMany({ where: { type: TransactionType.DEPOSIT, status: TransactionStatus.COMPLETED } }),
      this.prisma.transaction.findMany({ where: { type: TransactionType.WITHDRAWAL, status: TransactionStatus.COMPLETED } }),
    ]);

    return {
      users: {
        total: totalUsers,
        online: onlineUsers,
        newToday,
        newThisWeek,
        banned: bannedUsers,
      },
      challenges: {
        total: totalChallenges,
        active: activeChallenges,
        completed: completedChallenges,
        disputed: disputedChallenges,
        cancelledToday,
      },
      revenue: {
        totalCommissions: sumCommissions(allTransactions),
        todayCommissions: sumCommissions(todayTransactions),
        weekCommissions: sumCommissions(weekTransactions),
        monthCommissions: sumCommissions(monthTransactions),
      },
      wallet: {
        totalDeposited: deposits.reduce((sum, tx) => sum + Number(tx.amount), 0),
        totalWithdrawn: withdrawals.reduce((sum, tx) => sum + Number(tx.amount), 0),
        platformBalance: deposits.reduce((sum, tx) => sum + Number(tx.amount), 0) - withdrawals.reduce((sum, tx) => sum + Number(tx.amount), 0),
      },
    };
  }

  async getChartData(query: GetStatsQueryDto) {
    const days = query.period === '7d' ? 7 : query.period === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [commissions, users, challenges] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          type: TransactionType.COMMISSION,
          status: TransactionStatus.COMPLETED,
          createdAt: { gte: startDate },
        },
        select: { createdAt: true, amount: true },
      }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      this.prisma.challenge.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
    ]);

    const groupByDate = (items: any[], amountKey?: string) => {
      const map = new Map<string, number>();
      items.forEach(item => {
        const date = new Date(item.createdAt).toISOString().split('T')[0];
        const current = map.get(date) || 0;
        map.set(date, current + (amountKey ? Number(item[amountKey]) : 1));
      });
      return Array.from(map.entries()).map(([date, value]) => ({ date, [amountKey ? 'amount' : 'count']: value }));
    };

    return {
      revenue: groupByDate(commissions, 'amount'),
      newUsers: groupByDate(users),
      challenges: groupByDate(challenges),
    };
  }

  async getUsers(query: GetUsersQueryDto) {
    const { page = 1, limit = 20, search, status, role } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          isBanned: true,
          isVerified: true,
          gamesPlayed: true,
          createdAt: true,
          avatar: true,
          wallet: { select: { balance: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map(u => ({ ...u, balance: u.wallet?.balance || 0 })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: {
          include: {
            transactions: {
              take: 20,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        challengeParticipations: {
          take: 20,
          include: { challenge: true },
          orderBy: { joinedAt: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto, adminId: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
    });

    await this.createAdminLog(adminId, 'UPDATE_USER', id, 'USER', dto);
    return user;
  }

  async banUser(id: string, dto: BanUserDto, adminId: string) {
    const bannedUntil = dto.duration ? new Date(Date.now() + dto.duration * 60 * 60 * 1000) : null;

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        banReason: dto.reason,
        bannedUntil,
      },
    });

    await this.createAdminLog(adminId, 'BAN_USER', id, 'USER', { reason: dto.reason, duration: dto.duration });
    return user;
  }

  async unbanUser(id: string, adminId: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        isBanned: false,
        banReason: null,
        bannedUntil: null,
      },
    });

    await this.createAdminLog(adminId, 'UNBAN_USER', id, 'USER');
    return user;
  }

  async verifyUser(id: string, adminId: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isVerified: true },
    });

    await this.createAdminLog(adminId, 'VERIFY_USER', id, 'USER');
    return user;
  }

  async getChallenges(status?: string, type?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status as any;
    if (type) where.type = type as any;

    const [challenges, total] = await Promise.all([
      this.prisma.challenge.findMany({
        where,
        skip,
        take: limit,
        include: {
          creator: { select: { id: true, username: true, avatar: true } },
          participants: { include: { user: { select: { id: true, username: true, avatar: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.challenge.count({ where }),
    ]);

    return { challenges, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getChallengeById(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        creator: true,
        participants: { include: { user: true } },
        results: { include: { user: true } },
        dispute: true,
      },
    });

    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async cancelChallenge(id: string, dto: CancelChallengeDto, adminId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!challenge) throw new NotFoundException('Challenge not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.challenge.update({
        where: { id },
        data: { status: ChallengeStatus.CANCELLED },
      });

      for (const participant of challenge.participants) {
        if (participant.hasPaid) {
          const wallet = await tx.wallet.findUnique({ where: { userId: participant.userId } });
          if (wallet) {
            await tx.wallet.update({
              where: { userId: participant.userId },
              data: { balance: { increment: challenge.entryFee } },
            });

            await tx.transaction.create({
              data: {
                walletId: wallet.id,
                type: TransactionType.REFUND,
                amount: challenge.entryFee,
                status: TransactionStatus.COMPLETED,
                description: `Remboursement défi annulé: ${challenge.title}`,
              },
            });
          }
        }
      }
    });

    await this.createAdminLog(adminId, 'CANCEL_CHALLENGE', id, 'CHALLENGE', { reason: dto.reason });
    return { success: true };
  }

  async forceResult(id: string, dto: ForceResultDto, adminId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!challenge) throw new NotFoundException('Challenge not found');

    await this.prisma.$transaction(async (tx) => {
      for (const result of dto.results) {
        await tx.challengeParticipant.update({
          where: { challengeId_userId: { challengeId: id, userId: result.userId } },
          data: { rank: result.rank },
        });
      }

      await tx.challenge.update({
        where: { id },
        data: { status: ChallengeStatus.COMPLETED },
      });
    });

    await this.createAdminLog(adminId, 'FORCE_RESULT', id, 'CHALLENGE', { results: dto.results });
    return { success: true };
  }

  async getDisputes(status?: string) {
    return this.prisma.challengeDispute.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        challenge: {
          include: {
            participants: { include: { user: true } },
            results: { include: { user: true } },
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
            participants: { include: { user: true } },
            results: { include: { user: true } },
          },
        },
      },
    });

    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }

  async resolveDispute(id: string, dto: ResolveDisputeDto, adminId: string) {
    const dispute = await this.prisma.challengeDispute.findUnique({
      where: { id },
      include: { challenge: true },
    });

    if (!dispute) throw new NotFoundException('Dispute not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.challengeDispute.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          adminNote: dto.adminNote,
          resolvedBy: adminId,
          resolvedAt: new Date(),
        },
      });

      await tx.challenge.update({
        where: { id: dispute.challengeId },
        data: { status: ChallengeStatus.COMPLETED },
      });
    });

    await this.createAdminLog(adminId, 'RESOLVE_DISPUTE', id, 'DISPUTE', { winnerId: dto.winnerId, adminNote: dto.adminNote });
    return { success: true };
  }

  async getTransactions(query: GetTransactionsQueryDto) {
    const { userId, type, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) {
      const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      if (wallet) where.walletId = wallet.id;
    }
    if (type) where.type = type as any;
    if (status) where.status = status as any;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        include: { wallet: { include: { user: { select: { id: true, username: true, email: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adjustWallet(dto: AdjustWalletDto, adminId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId: dto.userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const amount = dto.type === 'CREDIT' ? dto.amount : -dto.amount;

    await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: dto.userId },
        data: { balance: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: dto.type === 'CREDIT' ? TransactionType.CREDIT : TransactionType.DEBIT,
          amount: Math.abs(dto.amount),
          status: TransactionStatus.COMPLETED,
          description: dto.description,
        },
      });
    });

    await this.createAdminLog(adminId, 'ADJUST_WALLET', dto.userId, 'WALLET', dto);
    return { success: true };
  }

  async refundTransaction(transactionId: string, adminId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException('Only completed transactions can be refunded');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: { balance: { increment: Number(transaction.amount) } },
      });

      await tx.transaction.create({
        data: {
          walletId: transaction.walletId,
          type: TransactionType.REFUND,
          amount: transaction.amount,
          status: TransactionStatus.COMPLETED,
          description: `Remboursement transaction ${transactionId}`,
        },
      });
    });

    await this.createAdminLog(adminId, 'REFUND_TRANSACTION', transactionId, 'TRANSACTION');
    return { success: true };
  }

  async getPlatformStats() {
    const [commissions, deposits, withdrawals] = await Promise.all([
      this.prisma.transaction.findMany({ where: { type: TransactionType.COMMISSION, status: TransactionStatus.COMPLETED } }),
      this.prisma.transaction.findMany({ where: { type: TransactionType.DEPOSIT, status: TransactionStatus.COMPLETED } }),
      this.prisma.transaction.findMany({ where: { type: TransactionType.WITHDRAWAL, status: TransactionStatus.COMPLETED } }),
    ]);

    const sum = (txs: any[]) => txs.reduce((acc, tx) => acc + Number(tx.amount), 0);

    return {
      totalCommissions: sum(commissions),
      totalInCirculation: sum(deposits) - sum(withdrawals),
      totalWithdrawals: sum(withdrawals),
    };
  }

  async getLogs(query: GetLogsQueryDto) {
    const { userId, action, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.adminId = userId;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        where,
        skip,
        take: limit,
        include: { admin: { select: { id: true, username: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminLog.count({ where }),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
