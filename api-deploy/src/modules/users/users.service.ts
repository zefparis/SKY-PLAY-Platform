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

    // Upsert sur cognitoSub (clé unique)
    const user = await this.prisma.user.upsert({
      where: { cognitoSub },
      update: {
        email,
        username,
        isVerified,
        // On ne touche jamais au mot de passe (Cognito source de vérité)
      },
      create: {
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
}
