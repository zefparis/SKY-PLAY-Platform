import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email: string;
  verified: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async me(user: RequestUser) {
    // On renvoie une version "safe" + données DB à jour
    const dbUser = await this.usersService.findById(user.id);
    if (!dbUser) {
      // edge case: user supprimé en DB, mais token valide
      return { user };
    }
    // Ne jamais renvoyer password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safe } = dbUser as any;
    return { user: safe };
  }

  async discordAuth(code: string) {
    if (!code) {
      throw new UnauthorizedException('Code Discord manquant');
    }

    try {
      // 1. Échanger le code contre un token Discord
      const tokenResponse = await this.exchangeDiscordCode(code);
      
      // 2. Récupérer le profil Discord
      const discordUser = await this.getDiscordUser(tokenResponse.access_token);
      
      // 3. Upsert user en DB
      const user = await this.upsertDiscordUser(discordUser);
      
      // 4. Générer JWT custom
      const tokens = await this.generateTokens(user);
      
      // Ne jamais renvoyer password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = user as any;
      
      return {
        user: safeUser,
        tokens,
      };
    } catch (error) {
      console.error('Discord auth error:', error);
      throw new HttpException(
        error.message || 'Erreur lors de l\'authentification Discord',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async exchangeDiscordCode(code: string): Promise<DiscordTokenResponse> {
    const clientId = this.configService.get('DISCORD_CLIENT_ID');
    const clientSecret = this.configService.get('DISCORD_CLIENT_SECRET');
    const redirectUri = this.configService.get('DISCORD_REDIRECT_URI');

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new UnauthorizedException(`Échec échange code Discord: ${error}`);
    }

    return response.json();
  }

  private async getDiscordUser(accessToken: string): Promise<DiscordUser> {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Échec récupération profil Discord');
    }

    return response.json();
  }

  private async upsertDiscordUser(discordUser: DiscordUser) {
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : null;

    const user = await this.prisma.user.upsert({
      where: { discordId: discordUser.id },
      create: {
        email: discordUser.email,
        username: discordUser.username,
        discordId: discordUser.id,
        avatar: avatarUrl,
        isVerified: discordUser.verified,
        cognitoSub: `discord_${discordUser.id}`,
        discordTag: `${discordUser.username}#${discordUser.discriminator}`,
      },
      update: {
        discordId: discordUser.id,
        avatar: avatarUrl,
        discordTag: `${discordUser.username}#${discordUser.discriminator}`,
      },
    });

    return user;
  }

  private async generateTokens(user: any) {
    const jwtSecret = this.configService.get('JWT_SECRET');
    
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '1h',
    });

    const idToken = this.jwtService.sign(
      { ...payload, name: user.username },
      {
        secret: jwtSecret,
        expiresIn: '1h',
      },
    );

    return {
      accessToken,
      idToken,
      expiresIn: 3600,
    };
  }
}
