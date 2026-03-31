import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Server } from 'socket.io';

@Injectable()
export class UsersService {
  private server: Server | null = null;

  constructor(private prisma: PrismaService) {}

  setServer(server: Server) {
    this.server = server;
  }

  private pushNotification(userId: string, notif: any) {
    this.server?.to(`user_${userId}`).emit('new_notification', notif);
  }

  private defaultUsernameFromEmail(email: string) {
    return email.split('@')[0];
  }

  private async generateUniqueUsername(base: string): Promise<string> {
    const sanitized = base.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20) || 'player';
    const existing = await this.prisma.user.findUnique({ where: { username: sanitized } });
    if (!existing) return sanitized;
    for (let i = 2; i <= 999; i++) {
      const candidate = `${sanitized.slice(0, 16)}_${i}`;
      const taken = await this.prisma.user.findUnique({ where: { username: candidate } });
      if (!taken) return candidate;
    }
    return `player_${Date.now()}`;
  }

  async create(data: any) {
    const user = await this.prisma.user.create({
      data: {
        ...data,
        wallet: {
          create: {
            balance: 0,
          },
        },
      },
      include: {
        wallet: true,
      },
    });
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { wallet: true },
    });
  }

  async findByCognitoSub(cognitoSub: string) {
    return this.prisma.user.findUnique({
      where: { cognitoSub },
      include: { wallet: true },
    });
  }

  /**
   * Crée un user si absent lors de la première requête authentifiée.
   * Ne stocke JAMAIS de mot de passe (Cognito est la source de vérité).
   */
  async findOrCreateFromCognito(params: {
    cognitoSub: string;
    email?: string;
    username?: string;
  }) {
    const existing = await this.findByCognitoSub(params.cognitoSub);
    if (existing) return existing;

    // username requis par le modèle. Stratégie fallback safe.
    const baseUsername =
      params.username ||
      (params.email ? params.email.split('@')[0] : undefined) ||
      `player_${params.cognitoSub.slice(0, 8)}`;

    // email est unique; si pas fourni, on fabrique un placeholder non délivrable.
    const email = params.email || `${params.cognitoSub}@cognito.local`;

    const uniqueUsername = await this.generateUniqueUsername(baseUsername);

    try {
      return await this.create({
        cognitoSub: params.cognitoSub,
        email,
        username: uniqueUsername,
        password: null,
        isVerified: true,
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const race = await this.findByCognitoSub(params.cognitoSub);
        if (race) return race;
      }
      throw err;
    }
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { wallet: true },
    });
  }

  /**
   * Upsert utilisateur à partir des infos Cognito.
   * Idempotent : plusieurs appels ne créent pas de doublon.
   * Met à jour email, username, isVerified si besoin.
   */
  async upsertFromCognito(params: {
    cognitoSub: string;
    email: string;
    username: string;
    isVerified: boolean;
  }) {
    const { cognitoSub, email, username, isVerified } = params;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.findByCognitoSub(cognitoSub);

    if (existingUser) {
      // L'utilisateur existe : ne mettre à jour que email et isVerified
      // NE PAS écraser username, firstName, lastName, bio, etc.
      const user = await this.prisma.user.update({
        where: { cognitoSub },
        data: {
          email,
          isVerified,
          // On ne touche PAS au username ni aux autres champs du profil
        },
        include: {
          wallet: true,
        },
      });
      return user;
    }

    // Nouvel utilisateur : créer avec username unique
    const uniqueUsername = await this.generateUniqueUsername(username);

    try {
      const user = await this.prisma.user.create({
        data: {
          cognitoSub,
          email,
          username: uniqueUsername,
          password: null,
          isVerified,
          wallet: { create: { balance: 0 } },
        },
        include: { wallet: true },
      });

      await this.maybeGrantWelcomeCredits(user.id);
      return user;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const race = await this.findByCognitoSub(cognitoSub);
        if (race) return race;
      }
      throw err;
    }
  }

  /**
   * Endpoint public (post-signup) : crée le user en DB dès que Cognito retourne un sub.
   * - Idempotent (upsert sur cognitoSub)
   * - isVerified doit rester false tant que /users/sync (post-login) n'a pas validé l'email.
   */
  async registerFromSignup(params: { email: string; cognitoSub: string }) {
    const { email, cognitoSub } = params;
    const username = this.defaultUsernameFromEmail(email);

    const user = await this.prisma.user.upsert({
      where: { cognitoSub },
      update: {
        // On garde l'email à jour si l'utilisateur réessaye avec le même sub
        email,
        username,
        // Ne pas passer isVerified=true ici
      },
      create: {
        cognitoSub,
        email,
        username,
        password: null,
        isVerified: false,
        wallet: {
          create: {
            balance: 0,
          },
        },
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    await this.maybeGrantWelcomeCredits(user.id);
    return user;
  }

  private async maybeGrantWelcomeCredits(userId: string): Promise<void> {
    const isTestMode =
      process.env.TEST_MODE === 'true' || process.env.NODE_ENV !== 'production';
    if (!isTestMode) return;

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return;

    const WELCOME_AMOUNT = 10_000;
    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: WELCOME_AMOUNT } },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'TEST_CREDIT' as any,
          amount: WELCOME_AMOUNT,
          status: 'COMPLETED' as any,
          description: 'Crédit de bienvenue test — Welcome test credits',
          balanceBefore: 0,
          balanceAfter: WELCOME_AMOUNT,
        },
      }),
    ]);
  }

  /**
   * Met à jour le profil de l'utilisateur.
   * Permet de modifier username, firstName, lastName, bio, discordTag, twitchUsername, avatar.
   */
  async updateProfile(userId: string, updateData: {
    username?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    discordTag?: string;
    twitchUsername?: string;
    avatar?: string;
  }) {
    // Vérifier que l'utilisateur existe
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Si username est modifié, vérifier qu'il n'est pas déjà pris
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: updateData.username },
      });
      if (existingUser) {
        throw new Error('Ce username est déjà utilisé');
      }
    }

    // Mettre à jour le profil
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateData.username && { username: updateData.username }),
        ...(updateData.firstName !== undefined && { firstName: updateData.firstName }),
        ...(updateData.lastName !== undefined && { lastName: updateData.lastName }),
        ...(updateData.bio !== undefined && { bio: updateData.bio }),
        ...(updateData.discordTag !== undefined && { discordTag: updateData.discordTag }),
        ...(updateData.twitchUsername !== undefined && { twitchUsername: updateData.twitchUsername }),
        ...(updateData.avatar !== undefined && { avatar: updateData.avatar }),
      },
      include: {
        wallet: true,
      },
    });

    return updatedUser;
  }

  async getLeaderboard(limit = 100) {
    return this.prisma.user.findMany({
      where: {
        isBanned: false,
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        level: true,
        xp: true,
        gamesWon: true,
        gamesPlayed: true,
      },
      orderBy: {
        xp: 'desc',
      },
      take: limit,
    });
  }

  async getOnlineUsers(currentUserId: string, limit = 50) {
    const friends = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: currentUserId, status: 'ACCEPTED' },
          { receiverId: currentUserId, status: 'ACCEPTED' },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });

    const friendIds = friends.map((f) =>
      f.senderId === currentUserId ? f.receiverId : f.senderId,
    );

    const onlineFriends = await this.prisma.user.findMany({
      where: {
        id: { in: friendIds },
        status: 'ONLINE',
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        status: true,
        level: true,
      },
      take: limit,
    });

    const otherOnlineUsers = await this.prisma.user.findMany({
      where: {
        status: 'ONLINE',
        id: { notIn: [...friendIds, currentUserId] },
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        status: true,
        level: true,
      },
      take: Math.max(0, limit - onlineFriends.length),
    });

    return [...onlineFriends, ...otherOnlineUsers];
  }

  async getPublicProfile(username: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        level: true,
        xp: true,
        fairPlayScore: true,
        gamesPlayed: true,
        gamesWon: true,
        status: true,
        lastSeen: true,
        createdAt: true,
        achievements: {
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            icon: true,
            unlockedAt: true,
          },
          orderBy: {
            unlockedAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    let friendshipStatus = 'NONE';
    if (currentUserId && currentUserId !== user.id) {
      const friendship = await this.prisma.friendship.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: user.id },
            { senderId: user.id, receiverId: currentUserId },
          ],
        },
      });

      if (friendship) {
        if (friendship.status === 'BLOCKED') {
          friendshipStatus =
            friendship.senderId === currentUserId ? 'BLOCKED_BY_YOU' : 'BLOCKED_BY_THEM';
        } else if (friendship.status === 'PENDING') {
          friendshipStatus =
            friendship.senderId === currentUserId ? 'PENDING_SENT' : 'PENDING_RECEIVED';
        } else {
          friendshipStatus = 'ACCEPTED';
        }
      }
    }

    return {
      ...user,
      friendshipStatus,
    };
  }

  async updateStatus(userId: string, status: 'ONLINE' | 'OFFLINE' | 'IN_GAME' | 'AWAY') {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status,
        ...(status === 'OFFLINE' && { lastSeen: new Date() }),
      },
      select: {
        id: true,
        username: true,
        status: true,
        lastSeen: true,
      },
    });
  }

  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        xp: true,
        level: true,
        _count: {
          select: {
            challengeParticipations: true,
          },
        },
      },
    });

    if (!user) {
      return {
        totalChallenges: 0,
        wins: 0,
        xp: 0,
        level: 1,
      };
    }

    // Compter les victoires (participations avec rank=1 dans des challenges COMPLETED)
    const wins = await this.prisma.challengeParticipant.count({
      where: {
        userId,
        rank: 1,
        challenge: {
          status: 'COMPLETED',
        },
      },
    });

    return {
      totalChallenges: user._count.challengeParticipations,
      wins,
      xp: user.xp,
      level: user.level,
    };
  }

  private discordStatusCache = new Map<string, { status: string; timestamp: number }>();

  // ─── KYC ─────────────────────────────────────────────────────────────────────

  async submitKyc(userId: string, dto: {
    firstName: string;
    lastName: string;
    idType: string;
    idNumber: string;
    idPhotoUrl?: string;
    selfieUrl?: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { kycStatus: true } });
    if (!user) throw new Error('Utilisateur introuvable');
    if (user.kycStatus === 'VERIFIED') throw new Error('Votre identité est déjà vérifiée.');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: 'SUBMITTED' as any,
        kycFirstName: dto.firstName,
        kycLastName: dto.lastName,
        kycIdType: dto.idType,
        kycIdNumber: dto.idNumber,
        kycIdPhotoUrl: dto.idPhotoUrl,
        kycSelfieUrl: dto.selfieUrl,
        kycSubmittedAt: new Date(),
        kycRejectedAt: null,
        kycRejectReason: null,
      },
      select: { id: true, kycStatus: true, kycSubmittedAt: true, kycFirstName: true, kycLastName: true, kycIdType: true },
    });

    // Notifier les admins
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      const notif = await this.prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'KYC_SUBMITTED' as any,
          title: '🪪 Nouveau dossier KYC soumis',
          body: `L'utilisateur ${dto.firstName} ${dto.lastName} a soumis son dossier KYC — à vérifier.`,
          data: { targetUserId: userId },
        },
      });
      this.pushNotification(admin.id, notif);
    }

    return updated;
  }

  async getKycStatus(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true,
        kycFirstName: true,
        kycLastName: true,
        kycIdType: true,
        kycSubmittedAt: true,
        kycVerifiedAt: true,
        kycRejectedAt: true,
        kycRejectReason: true,
      },
    });
  }

  // ─── AUTO-EXCLUSION ───────────────────────────────────────────────────────────

  private calcExclusionUntil(duration: string): Date | null {
    const now = new Date();
    const map: Record<string, number> = {
      '24H':      24 * 60 * 60 * 1000,
      '72H':      72 * 60 * 60 * 1000,
      '1_WEEK':   7  * 24 * 60 * 60 * 1000,
      '1_MONTH':  30 * 24 * 60 * 60 * 1000,
      '3_MONTHS': 90 * 24 * 60 * 60 * 1000,
    };
    if (duration === 'PERMANENT') return null;
    const ms = map[duration];
    if (!ms) throw new Error(`Durée invalide : ${duration}`);
    return new Date(now.getTime() + ms);
  }

  async selfExclude(userId: string, dto: { duration: string; reason?: string }) {
    const user = await (this.prisma.user as any).findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, exclusionStatus: true } as any,
    }) as { id: string; email: string; username: string; exclusionStatus: string } | null;

    if (!user) throw new Error('Utilisateur introuvable');
    if (user.exclusionStatus === 'PERMANENTLY_EXCLUDED') {
      throw new Error('Votre compte est déjà définitivement fermé.');
    }

    const isCoolingOff = dto.duration === '24H' || dto.duration === '72H';
    const isPermanent  = dto.duration === 'PERMANENT';
    const exclusionStatus = isPermanent
      ? 'PERMANENTLY_EXCLUDED'
      : isCoolingOff ? 'COOLING_OFF' : 'SELF_EXCLUDED';
    const exclusionUntil = this.calcExclusionUntil(dto.duration);

    await (this.prisma.user as any).update({
      where: { id: userId },
      data: {
        exclusionStatus,
        exclusionUntil,
        exclusionReason: dto.reason ?? null,
        exclusionRequestedAt: new Date(),
      } as any,
    });

    await (this.prisma as any).exclusionHistory.create({
      data: {
        userId,
        type: exclusionStatus,
        duration: dto.duration,
        endsAt: exclusionUntil,
        reason: dto.reason ?? null,
        requestedBy: 'self',
      },
    });

    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      const notif = await this.prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SYSTEM' as any,
          title: `\u{1F6AB} Auto-exclusion — ${user.username}`,
          body: `${user.username} s'est auto-exclu (${dto.duration}).${dto.reason ? ` Raison : ${dto.reason}` : ''}`,
          data: { targetUserId: userId, duration: dto.duration },
        },
      });
      this.pushNotification(admin.id, notif);
    }

    console.log(
      `[EMAIL] To: ${user.email} | Sujet: SKY PLAY — Confirmation de votre auto-exclusion | ` +
      `Corps: Votre compte est suspendu${exclusionUntil ? ` jusqu'au ${exclusionUntil.toLocaleDateString('fr-FR')}` : ' définitivement'}. ` +
      `Si vous n'êtes pas à l'origine de cette demande, contactez : support@skyplay.cm`,
    );

    return {
      status: exclusionStatus,
      exclusionUntil,
      message: isPermanent
        ? 'Votre compte a été définitivement fermé.'
        : `Votre compte est suspendu jusqu'au ${exclusionUntil?.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`,
    };
  }

  async cancelExclusion(userId: string) {
    const user = await (this.prisma.user as any).findUnique({
      where: { id: userId },
      select: { exclusionStatus: true, exclusionUntil: true } as any,
    }) as { exclusionStatus: string; exclusionUntil: Date | null } | null;

    if (!user) throw new Error('Utilisateur introuvable');

    if (user.exclusionStatus !== 'COOLING_OFF') {
      throw new Error(
        user.exclusionStatus === 'PERMANENTLY_EXCLUDED'
          ? 'L\'exclusion définitive ne peut pas être annulée.'
          : 'L\'auto-exclusion de 1 semaine ou plus ne peut pas être annulée.',
      );
    }

    await (this.prisma.user as any).update({
      where: { id: userId },
      data: { exclusionStatus: 'ACTIVE', exclusionUntil: null, exclusionReason: null } as any,
    });

    return { status: 'ACTIVE', message: 'Votre pause a été annulée. Votre compte est actif.' };
  }

  async getExclusionStatus(userId: string) {
    const user = await (this.prisma.user as any).findUnique({
      where: { id: userId },
      select: {
        exclusionStatus: true,
        exclusionUntil: true,
        exclusionReason: true,
        exclusionRequestedAt: true,
      } as any,
    }) as { exclusionStatus: string; exclusionUntil: Date | null; exclusionReason: string | null; exclusionRequestedAt: Date | null } | null;

    if (!user) return { exclusionStatus: 'ACTIVE', exclusionUntil: null };

    const now = new Date();
    if (
      (user.exclusionStatus === 'COOLING_OFF' || user.exclusionStatus === 'SELF_EXCLUDED') &&
      user.exclusionUntil && user.exclusionUntil <= now
    ) {
      await (this.prisma.user as any).update({
        where: { id: userId },
        data: { exclusionStatus: 'ACTIVE', exclusionUntil: null, exclusionReason: null } as any,
      });
      return { exclusionStatus: 'ACTIVE', exclusionUntil: null };
    }

    return user;
  }

  // ─── DEVICE FINGERPRINT / ANTI-MULTI-ACCOUNT ─────────────────────────────────

  async registerDevice(
    userId: string,
    deviceData: { fingerprint: string; userAgent?: string; language?: string; timezone?: string; screen?: string },
    ipAddress?: string,
  ) {
    // 1. Upsert device record
    await (this.prisma.deviceFingerprint as any).upsert({
      where: { userId_fingerprint: { userId, fingerprint: deviceData.fingerprint } },
      create: { userId, ...deviceData, ipAddress },
      update: { lastSeenAt: new Date(), ipAddress },
    });

    // 2. Check if this fingerprint belongs to OTHER users
    const otherUsers = await (this.prisma.deviceFingerprint as any).findMany({
      where: {
        fingerprint: deviceData.fingerprint,
        userId: { not: userId },
        isFlagged: false,
      },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    if (otherUsers.length > 0) {
      await this.flagMultiAccount(userId, otherUsers, deviceData.fingerprint);
    }

    // 3. IP-based soft flag: > 3 distinct accounts from same IP
    if (ipAddress) {
      const ipAccounts = await (this.prisma.deviceFingerprint as any).findMany({
        where: { ipAddress, userId: { not: userId } },
        select: { userId: true },
        distinct: ['userId'],
      });

      if (ipAccounts.length >= 3) {
        await this.prisma.adminLog.create({
          data: {
            adminId: 'SYSTEM',
            action: 'IP_MULTI_ACCOUNT_SOFT_FLAG',
            targetId: userId,
            targetType: 'USER',
            details: { ipAddress, linkedAccountCount: ipAccounts.length + 1, linkedAccounts: ipAccounts.map((a: any) => a.userId) },
          },
        });
      }
    }

    return { registered: true };
  }

  private async flagMultiAccount(userId: string, otherUsers: any[], fingerprint: string) {
    // Flag all devices sharing this fingerprint
    await (this.prisma.deviceFingerprint as any).updateMany({
      where: { fingerprint },
      data: { isFlagged: true, flagReason: 'MULTI_ACCOUNT_DETECTED' },
    });

    // Admin log
    await this.prisma.adminLog.create({
      data: {
        adminId: 'SYSTEM',
        action: 'MULTI_ACCOUNT_DETECTED',
        targetId: userId,
        targetType: 'USER',
        details: {
          fingerprint,
          linkedAccounts: otherUsers.map((u: any) => ({ userId: u.userId, username: u.user?.username, email: u.user?.email })),
        },
      },
    });
  }

  async getSecurityAlerts() {
    const alerts = await this.prisma.adminLog.findMany({
      where: { action: { in: ['MULTI_ACCOUNT_DETECTED', 'IP_MULTI_ACCOUNT_SOFT_FLAG'] } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return alerts;
  }

  async getFlaggedDevices() {
    return (this.prisma.deviceFingerprint as any).findMany({
      where: { isFlagged: true },
      include: { user: { select: { id: true, username: true, email: true, avatar: true } } },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async unflagDevice(deviceId: string) {
    return (this.prisma.deviceFingerprint as any).update({
      where: { id: deviceId },
      data: { isFlagged: false, flagReason: null },
    });
  }

  async getDeviceStats() {
    const [total, flagged, multiAccountAlerts, ipAlerts] = await Promise.all([
      (this.prisma.deviceFingerprint as any).count(),
      (this.prisma.deviceFingerprint as any).count({ where: { isFlagged: true } }),
      this.prisma.adminLog.count({ where: { action: 'MULTI_ACCOUNT_DETECTED' } }),
      this.prisma.adminLog.count({ where: { action: 'IP_MULTI_ACCOUNT_SOFT_FLAG' } }),
    ]);
    return { totalDevices: total, flaggedDevices: flagged, multiAccountAlerts, ipAlerts };
  }

  async getDiscordStatus(userId: string) {
    // Vérifier le cache (60s)
    const cached = this.discordStatusCache.get(userId);
    if (cached && Date.now() - cached.timestamp < 60000) {
      return { status: cached.status };
    }

    try {
      // Récupérer l'utilisateur pour obtenir son discordId
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { discordId: true },
      });

      if (!user?.discordId) {
        return { status: 'offline' };
      }

      const botToken = process.env.DISCORD_BOT_TOKEN;
      const guildId = process.env.DISCORD_GUILD_ID;

      if (!botToken || !guildId) {
        console.warn('Discord bot token or guild ID not configured');
        return { status: 'offline' };
      }

      // Appeler l'API Discord pour récupérer le membre du serveur
      const response = await fetch(
        `https://discord.com/api/guilds/${guildId}/members/${user.discordId}`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        }
      );

      if (!response.ok) {
        return { status: 'offline' };
      }

      const member = await response.json();
      const status = member.status || 'offline';

      // Mettre en cache
      this.discordStatusCache.set(userId, { status, timestamp: Date.now() });

      return { status };
    } catch (error) {
      console.error('Error fetching Discord status:', error);
      return { status: 'offline' };
    }
  }
}
