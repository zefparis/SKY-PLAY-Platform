import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { GameProvider, LinkedAccount } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoHelper } from './crypto.helper';

type SafeLinkedAccount = Omit<LinkedAccount, 'accessToken' | 'refreshToken'>;

@Injectable()
export class LinkedAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoHelper,
  ) {}

  /**
   * Returns all linked accounts for a user — tokens are NEVER exposed.
   */
  async findByUser(userId: string): Promise<SafeLinkedAccount[]> {
    const accounts = await this.prisma.linkedAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return accounts.map(({ accessToken: _a, refreshToken: _r, ...safe }) => safe);
  }

  /**
   * Links a Steam account (OpenID — no OAuth tokens, only steamId + profile).
   */
  async linkSteam(
    userId: string,
    steamId: string,
    profile: { username?: string; avatarUrl?: string; profileUrl?: string },
  ): Promise<SafeLinkedAccount> {
    const existing = await this.prisma.linkedAccount.findUnique({
      where: { provider_externalId: { provider: GameProvider.STEAM, externalId: steamId } },
    });

    if (existing && existing.userId !== userId) {
      throw new ConflictException('Ce compte Steam est déjà lié à un autre compte Skyplay');
    }

    const account = await this.prisma.linkedAccount.upsert({
      where: { userId_provider: { userId, provider: GameProvider.STEAM } },
      create: {
        userId,
        provider: GameProvider.STEAM,
        externalId: steamId,
        username: profile.username ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        profileUrl: profile.profileUrl ?? null,
        isVerified: true,
      },
      update: {
        externalId: steamId,
        username: profile.username ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        profileUrl: profile.profileUrl ?? null,
        isVerified: true,
      },
    });

    const { accessToken: _a, refreshToken: _r, ...safe } = account;
    return safe;
  }

  /**
   * Links an Epic Games account — access/refresh tokens stored encrypted.
   */
  async linkEpic(
    userId: string,
    epicId: string,
    accessToken: string,
    refreshToken: string,
    username: string,
  ): Promise<SafeLinkedAccount> {
    const existing = await this.prisma.linkedAccount.findUnique({
      where: { provider_externalId: { provider: GameProvider.EPIC, externalId: epicId } },
    });

    if (existing && existing.userId !== userId) {
      throw new ConflictException('Ce compte Epic est déjà lié à un autre compte Skyplay');
    }

    const encryptedAccess = this.crypto.encrypt(accessToken);
    const encryptedRefresh = this.crypto.encrypt(refreshToken);

    const account = await this.prisma.linkedAccount.upsert({
      where: { userId_provider: { userId, provider: GameProvider.EPIC } },
      create: {
        userId,
        provider: GameProvider.EPIC,
        externalId: epicId,
        username,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        isVerified: true,
      },
      update: {
        externalId: epicId,
        username,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        isVerified: true,
      },
    });

    const { accessToken: _a, refreshToken: _r, ...safe } = account;
    return safe;
  }

  /**
   * Unlinks a gaming account. Blocks unlinking if user has an active challenge.
   */
  async unlink(userId: string, provider: GameProvider): Promise<void> {
    const account = await this.prisma.linkedAccount.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    if (!account) {
      throw new NotFoundException(`Aucun compte ${provider} lié à cet utilisateur`);
    }

    // Block unlink if user has an active challenge
    const activeChallenge = await this.prisma.challengeParticipant.findFirst({
      where: {
        userId,
        challenge: {
          status: { in: ['IN_PROGRESS', 'VALIDATING'] as any[] },
        },
      },
    });

    if (activeChallenge) {
      throw new ForbiddenException(
        'Impossible de délier ce compte pendant un défi en cours',
      );
    }

    await this.prisma.linkedAccount.delete({
      where: { userId_provider: { userId, provider } },
    });
  }

  /**
   * Returns decrypted tokens — INTERNAL USE ONLY, never expose via REST.
   */
  async getDecryptedTokens(
    userId: string,
    provider: GameProvider,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    const account = await this.prisma.linkedAccount.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    if (!account || !account.accessToken) return null;

    return {
      accessToken: this.crypto.decrypt(account.accessToken),
      refreshToken: account.refreshToken
        ? this.crypto.decrypt(account.refreshToken)
        : '',
    };
  }
}
