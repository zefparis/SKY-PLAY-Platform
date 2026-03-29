import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

    return user;
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

  private discordStatusCache = new Map<string, { status: string; timestamp: number }>();

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
