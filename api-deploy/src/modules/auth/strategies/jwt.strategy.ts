import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as jwksRsa from 'jwks-rsa';
import { UsersService } from '../../users/users.service';
import { CognitoJwtPayload } from '../../../common/types/cognito-jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private logger = new Logger(JwtStrategy.name);

  constructor(
    private config: ConfigService,
    private usersService: UsersService,
  ) {
    const cognito = config.get('cognito');
    const issuer = cognito?.issuer;
    const jwksUri = cognito?.jwksUri;
    const audience = cognito?.clientId;

    if (!issuer || !jwksUri || !audience) {
      // Les erreurs sont déjà explicites dans cognito.config.ts
      throw new Error('Cognito config is missing (issuer/jwksUri/clientId)');
    }

    super({
      jwtFromRequest: (req) => {
        const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (token) {
          // Log les 50 premiers caractères du token
          this.logger.debug(`[JWT] Token reçu (50 premiers chars): ${token.substring(0, 50)}...`);
          
          // Décoder le payload sans vérifier (juste pour debug)
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
              this.logger.debug(`[JWT] Payload décodé: ${JSON.stringify({
                iss: payload.iss,
                aud: payload.aud,
                client_id: payload.client_id,
                token_use: payload.token_use,
                sub: payload.sub,
                exp: payload.exp
              })}`);
            }
          } catch (e) {
            this.logger.warn(`[JWT] Impossible de décoder le token pour debug: ${e.message}`);
          }
        }
        return token;
      },
      ignoreExpiration: false,
      issuer,
      // `audience` correspond à `client_id` (access token) ou `aud` (id token)
      // passport-jwt check audience vs payload.aud.
      audience,
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 10 * 60 * 1000,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri,
      }) as any,
    });

    // IMPORTANT: pas de `this.*` avant le `super()`
    Logger.log(
      `Cognito JWT configured: issuer=${issuer} audience(clientId)=${audience} jwksUri=${jwksUri}`,
      JwtStrategy.name,
    );
  }

  async validate(payload: CognitoJwtPayload) {
    // Debug détaillé du payload validé
    this.logger.log(`[JWT validate] Payload validé: ${JSON.stringify({
      sub: payload.sub,
      iss: payload.iss,
      token_use: payload.token_use,
      aud: payload.aud,
      client_id: payload.client_id,
      email: payload.email,
      exp: payload.exp,
    })}`);

    const cognitoSub = payload.sub;
    const email = payload.email;
    const username = payload.username || payload.email?.split('@')[0] || payload.sub;

    const user = await this.usersService.findOrCreateFromCognito({
      cognitoSub,
      email,
      username,
    });

    return {
      id: user.id,
      cognitoSub,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }
}
