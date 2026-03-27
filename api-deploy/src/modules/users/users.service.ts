import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
}
