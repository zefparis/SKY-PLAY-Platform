import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private defaultUsernameFromEmail(email: string) {
    return email.split('@')[0];
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

    return this.create({
      cognitoSub: params.cognitoSub,
      email,
      username: baseUsername,
      password: null,
      isVerified: true,
    });
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

    // Nouvel utilisateur : créer avec les données de base
    const user = await this.prisma.user.create({
      data: {
        cognitoSub,
        email,
        username,
        password: null,
        isVerified,
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
}
