import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Server } from 'socket.io';
import axios from 'axios';
import * as crypto from 'crypto';

const FLW_BASE = 'https://api.flutterwave.com/v3';
const MIN_DEPOSIT = 500;
const MIN_WITHDRAWAL = 1000;

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private server: Server;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  private get secretKey(): string {
    return this.config.get<string>('FLUTTERWAVE_SECRET_KEY') ?? '';
  }

  private get flwHeaders() {
    return { Authorization: `Bearer ${this.secretKey}`, 'Content-Type': 'application/json' };
  }

  private emitWalletUpdate(userId: string, balance: number, transaction: any) {
    if (this.server) {
      this.server.to(`user_${userId}`).emit('wallet_update', { userId, balance, transaction });
    }
  }

  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, balance: 0, currency: 'XAF' },
      });
    }
    return wallet;
  }

  async getWallet(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { kycStatus: true, dailyDepositLimit: true, weeklyDepositLimit: true, dailySpendLimit: true } });

    const [totalDeposited, totalWon, totalMised] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { walletId: wallet.id, type: 'DEPOSIT', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { walletId: wallet.id, type: { in: ['CHALLENGE_CREDIT', 'CHALLENGE_WIN'] as any }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { walletId: wallet.id, type: { in: ['CHALLENGE_DEBIT', 'CHALLENGE_ENTRY'] as any }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    const recentTransactions = await this.prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const deposited = Math.abs(Number(totalDeposited._sum.amount ?? 0));
    const won = Math.abs(Number(totalWon._sum.amount ?? 0));
    const mised = Math.abs(Number(totalMised._sum.amount ?? 0));

    return {
      ...wallet,
      balance: Number(wallet.balance),
      consumptionBalance: wallet.consumptionBalance,
      rewardBalance: wallet.rewardBalance,
      kycStatus: user?.kycStatus ?? 'PENDING',
      limits: {
        dailyDepositLimit: user?.dailyDepositLimit ?? 50000,
        weeklyDepositLimit: user?.weeklyDepositLimit ?? 200000,
        dailySpendLimit: user?.dailySpendLimit ?? 20000,
      },
      stats: {
        totalDeposited: deposited,
        totalWon: won,
        totalMised: mised,
        gainsNets: won - mised,
      },
      recentTransactions,
    };
  }

  async getTransactions(userId: string, params: { page?: number; limit?: number; type?: string } = {}) {
    const wallet = await this.getOrCreateWallet(userId);
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const where: any = { walletId: wallet.id };
    if (params.type && params.type !== 'ALL') where.type = params.type;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.transaction.count({ where }),
    ]);

    return { transactions, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async initiateDeposit(userId: string, dto: {
    amount: number;
    paymentMethod: 'MTN' | 'ORANGE' | 'CARD';
    phoneNumber?: string;
    email: string;
    name: string;
  }) {
    if (dto.amount < MIN_DEPOSIT) {
      throw new BadRequestException(`Montant minimum : ${MIN_DEPOSIT} XAF`);
    }
    if ((dto.paymentMethod === 'MTN' || dto.paymentMethod === 'ORANGE') && !dto.phoneNumber) {
      throw new BadRequestException('Numéro de téléphone requis pour Mobile Money');
    }

    // ─── Vérification limites dépôt ──────────────────────────────────────────
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { dailyDepositLimit: true, weeklyDepositLimit: true } });
    const limits = user ?? { dailyDepositLimit: 50000, weeklyDepositLimit: 200000 };

    const wallet = await this.getOrCreateWallet(userId);
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0, 0, 0, 0);

    const [dailyTotal, weeklyTotal] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { walletId: wallet.id, type: 'DEPOSIT', status: { in: ['PENDING', 'COMPLETED'] }, createdAt: { gte: dayStart } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { walletId: wallet.id, type: 'DEPOSIT', status: { in: ['PENDING', 'COMPLETED'] }, createdAt: { gte: weekStart } },
        _sum: { amount: true },
      }),
    ]);

    const dailyDeposited = Number(dailyTotal._sum.amount ?? 0);
    const weeklyDeposited = Number(weeklyTotal._sum.amount ?? 0);

    if (dailyDeposited + dto.amount > limits.dailyDepositLimit) {
      throw new ForbiddenException(`Limite journalière de dépôt atteinte (${limits.dailyDepositLimit} SKY/jour). Déjà déposé aujourd'hui : ${Math.round(dailyDeposited)} SKY.`);
    }
    if (weeklyDeposited + dto.amount > limits.weeklyDepositLimit) {
      throw new ForbiddenException(`Limite hebdomadaire de dépôt atteinte (${limits.weeklyDepositLimit} SKY/semaine).`);
    }

    const txRef = `SKY-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const transaction = await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: dto.amount,
        status: 'PENDING',
        reference: txRef,
        description: `Dépôt ${dto.paymentMethod} — ${dto.amount} XAF`,
        paymentMethod: dto.paymentMethod,
        phoneNumber: dto.phoneNumber,
      } as any,
    });

    try {
      if (dto.paymentMethod === 'CARD') {
        const appUrl = this.config.get<string>('NEXT_PUBLIC_APP_URL') ?? 'https://skyplay.app';
        const response = await axios.post(`${FLW_BASE}/payments`, {
          tx_ref: txRef,
          amount: dto.amount,
          currency: 'XAF',
          redirect_url: `${appUrl}/wallet?status=success&txRef=${txRef}&txId=${transaction.id}`,
          customer: { email: dto.email, name: dto.name },
          customizations: { title: 'SKY PLAY — Dépôt Wallet', description: 'Rechargez votre wallet SKY PLAY' },
          meta: { transactionId: transaction.id, userId },
        }, { headers: this.flwHeaders });

        return { transactionId: transaction.id, paymentLink: response.data?.data?.link, status: 'PENDING', txRef };
      } else {
        const network = dto.paymentMethod === 'MTN' ? 'MTN' : 'ORANGE';
        const response = await axios.post(
          `${FLW_BASE}/charges?type=mobile_money_franco`,
          {
            tx_ref: txRef,
            amount: dto.amount,
            currency: 'XAF',
            email: dto.email,
            phone_number: dto.phoneNumber,
            fullname: dto.name,
            network,
          },
          { headers: this.flwHeaders },
        );

        return { transactionId: transaction.id, status: response.data?.status, txRef, meta: response.data?.meta };
      }
    } catch (err: any) {
      await this.prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'FAILED' } });
      const msg = err.response?.data?.message ?? err.message ?? 'Erreur Flutterwave';
      throw new BadRequestException(msg);
    }
  }

  async creditDeposit(walletId: string, amount: number) {
    await this.prisma.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: amount }, consumptionBalance: { increment: amount } },
    });
  }

  async verifyDeposit(userId: string, flwTxId: string, transactionId?: string) {
    let response: any;
    try {
      response = await axios.get(`${FLW_BASE}/transactions/${flwTxId}/verify`, { headers: this.flwHeaders });
    } catch {
      return { status: 'FAILED', reason: 'Impossible de vérifier auprès de Flutterwave' };
    }

    const flwData = response.data?.data;
    if (!flwData || flwData.status !== 'successful' || flwData.currency !== 'XAF') {
      if (transactionId) await this.prisma.transaction.update({ where: { id: transactionId }, data: { status: 'FAILED', flwTxId } as any }).catch(() => {});
      return { status: 'FAILED', reason: 'Paiement non validé par Flutterwave' };
    }

    let transaction: any;
    if (transactionId) {
      transaction = await this.prisma.transaction.findFirst({ where: { id: transactionId }, include: { wallet: true } });
    }
    if (!transaction) {
      transaction = await this.prisma.transaction.findFirst({ where: { reference: flwData.tx_ref }, include: { wallet: true } });
    }
    if (!transaction) return { status: 'NOT_FOUND' };
    if (transaction.status === 'COMPLETED') return { status: 'COMPLETED', alreadyProcessed: true };

    const expectedAmount = Math.abs(Number(transaction.amount));
    if (Math.abs(flwData.amount - expectedAmount) > 1) {
      await this.prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'FAILED', flwTxId } as any });
      return { status: 'FAILED', reason: 'Montant incorrect' };
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { id: transaction.walletId } });
    const balanceBefore = Number(wallet!.balance);
    const balanceAfter = balanceBefore + expectedAmount;

    await this.prisma.$transaction([
      this.prisma.wallet.update({ where: { id: transaction.walletId }, data: { balance: { increment: expectedAmount }, consumptionBalance: { increment: expectedAmount } } }),
      this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'COMPLETED', flwTxId, flwRef: flwData.flw_ref, balanceBefore, balanceAfter } as any,
      }),
    ]);

    const txUserId = transaction.wallet?.userId ?? userId;
    this.emitWalletUpdate(txUserId, balanceAfter, { ...transaction, status: 'COMPLETED' });
    this.logger.log(`Deposit confirmed: ${expectedAmount} XAF for user ${txUserId}`);
    return { status: 'COMPLETED', balance: balanceAfter };
  }

  async handleWebhook(payload: any, signature: string) {
    const expectedSig = crypto
      .createHmac('sha256', this.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expectedSig) {
      const verifHash = this.config.get<string>('FLUTTERWAVE_SECRET_HASH');
      if (!verifHash || signature !== verifHash) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    if (payload.event === 'charge.completed' && payload.data?.id) {
      await this.verifyDeposit('', String(payload.data.id)).catch((e) => this.logger.error('Webhook verify error:', e));
    }

    return { received: true };
  }

  async initiateWithdrawal(userId: string, dto: {
    amount: number;
    phoneNumber: string;
    network: 'MTN' | 'ORANGE';
    name: string;
  }) {
    if (dto.amount < MIN_WITHDRAWAL) {
      throw new BadRequestException(`Montant minimum de retrait : ${MIN_WITHDRAWAL} XAF`);
    }

    // ─── Vérification KYC ────────────────────────────────────────────────────
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { kycStatus: true } });
    if (!user || user.kycStatus !== 'VERIFIED') {
      const statusMsg = user?.kycStatus === 'SUBMITTED' ? '⏳ Votre dossier KYC est en cours d\'examen (24-48h).' : '🔒 Vérification d\'identité (KYC) requise avant tout retrait. Accédez à /profile/kyc.';
      throw new ForbiddenException(statusMsg);
    }

    const wallet = await this.getOrCreateWallet(userId);

    // ─── Retrait depuis rewardBalance uniquement ──────────────────────────────
    if (wallet.rewardBalance < dto.amount) {
      throw new ForbiddenException(`Seules les primes de performance sont retirables. Solde récompenses disponible : ${wallet.rewardBalance} SKY.`);
    }

    const txRef = `SKY-WD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore - dto.amount;

    const [, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: dto.amount }, rewardBalance: { decrement: dto.amount } } }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          amount: -dto.amount,
          status: 'PENDING',
          reference: txRef,
          description: `Retrait ${dto.network} — ${dto.phoneNumber}`,
          paymentMethod: dto.network,
          phoneNumber: dto.phoneNumber,
          balanceBefore,
          balanceAfter,
        } as any,
      }),
    ]);

    try {
      const accountBank = dto.network === 'MTN' ? 'MPS' : 'OMCM';
      await axios.post(`${FLW_BASE}/transfers`, {
        account_bank: accountBank,
        account_number: dto.phoneNumber,
        amount: dto.amount,
        currency: 'XAF',
        narration: 'SKY PLAY retrait',
        reference: txRef,
        meta: [{ sender: 'SKY PLAY', mobile_number: dto.phoneNumber, recipient_name: dto.name }],
      }, { headers: this.flwHeaders });

      await this.prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'COMPLETED' } });
      this.emitWalletUpdate(userId, balanceAfter, { ...transaction, status: 'COMPLETED' });
      return { status: 'COMPLETED', balance: balanceAfter };
    } catch (err: any) {
      await this.prisma.$transaction([
        this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: dto.amount } } }),
        this.prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'FAILED' } }),
      ]);
      const msg = err.response?.data?.message ?? err.message ?? 'Erreur transfert';
      throw new BadRequestException(msg);
    }
  }

  async credit(userId: string, amount: number, type: string, description?: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + amount;

    // ─── Séparation des sous-soldes ─────────────────────────────────────────
    const isReward = type === 'CHALLENGE_CREDIT' || type === 'CHALLENGE_WIN';
    const subBalanceUpdate = isReward
      ? { rewardBalance: { increment: amount } }
      : { consumptionBalance: { increment: amount } };

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount }, ...subBalanceUpdate } });
      return tx.transaction.create({
        data: { walletId: wallet.id, type: type as any, amount, status: 'COMPLETED', description, balanceBefore, balanceAfter } as any,
      });
    });

    this.emitWalletUpdate(userId, balanceAfter, result);
    return result;
  }

  async debit(userId: string, amount: number, type: string, description?: string) {
    const wallet = await this.getOrCreateWallet(userId);
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Solde insuffisant');
    }

    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore - amount;

    // ─── Débit d'abord consumptionBalance, puis rewardBalance ───────────────
    const fromConsumption = Math.min(wallet.consumptionBalance, amount);
    const fromReward = amount - fromConsumption;
    const subBalanceUpdate: any = {};
    if (fromConsumption > 0) subBalanceUpdate.consumptionBalance = { decrement: fromConsumption };
    if (fromReward > 0) subBalanceUpdate.rewardBalance = { decrement: fromReward };

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount }, ...subBalanceUpdate } });
      return tx.transaction.create({
        data: { walletId: wallet.id, type: type as any, amount: -amount, status: 'COMPLETED', description, balanceBefore, balanceAfter } as any,
      });
    });

    this.emitWalletUpdate(userId, balanceAfter, result);
    return result;
  }

  async updateLimits(userId: string, dto: {
    dailyDepositLimit?: number;
    weeklyDepositLimit?: number;
    dailySpendLimit?: number;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { dailyDepositLimit: true, weeklyDepositLimit: true, dailySpendLimit: true, limitsPendingIncrease: true } });
    if (!user) throw new BadRequestException('Utilisateur introuvable');

    const directUpdate: any = {};
    const pending: any[] = (user.limitsPendingIncrease as any[] ?? []);
    const applyAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const fieldMap: Record<string, number> = {
      dailyDepositLimit: user.dailyDepositLimit,
      weeklyDepositLimit: user.weeklyDepositLimit,
      dailySpendLimit: user.dailySpendLimit,
    };

    for (const [field, newValue] of Object.entries(dto) as [string, number][]) {
      if (newValue === undefined) continue;
      const current = fieldMap[field];
      if (newValue <= current) {
        directUpdate[field] = newValue;
      } else {
        pending.push({ field, newValue, applyAt: applyAt.toISOString() });
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { ...directUpdate, limitsPendingIncrease: pending, limitsUpdatedAt: new Date() },
    });

    return {
      applied: directUpdate,
      pending: pending.filter((p: any) => new Date(p.applyAt) > new Date()),
      message: Object.keys(directUpdate).length > 0
        ? 'Limites mises à jour immédiatement.'
        : 'Augmentation enregistrée. Elle sera effective dans 48h (anti-impulsivité).',
    };
  }
}
