import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as jwksRsa from 'jwks-rsa';
import { UsersService } from '../../users/users.service';
import { CognitoJwtPayload } from '../../../common/types/cognito-jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
  }

  async validate(payload: CognitoJwtPayload) {
    // On accepte principalement l'access token (token_use=access)
    if (payload.token_use && payload.token_use !== 'access') {
      // si vous voulez accepter id token aussi, retirer ce check.
      throw new Error('Invalid token_use: expected access token');
    }

    const cognitoSub = payload.sub;
    const email = payload.email;
    const username = payload.username || payload['cognito:username'];

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
    };
  }
}
