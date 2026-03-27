import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
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

    // IMPORTANT: pas de `this.*` avant le `super()`
    Logger.log(
      `Cognito JWT configured: issuer=${issuer} audience(clientId)=${audience} jwksUri=${jwksUri}`,
      JwtStrategy.name,
    );
  }

  async validate(payload: CognitoJwtPayload) {
    const cognito = this.config.get('cognito');
    const expectedIssuer = cognito?.issuer;
    const expectedAudience = cognito?.clientId;

    // Debug utile (sans spammer la prod: ce logger peut être filtré via level)
    Logger.debug(
      {
      sub: payload.sub,
      iss: payload.iss,
      token_use: payload.token_use,
      aud: payload.aud,
      client_id: payload.client_id,
      exp: payload.exp,
      } as any,
      JwtStrategy.name,
    );

    if (expectedIssuer && payload.iss !== expectedIssuer) {
      Logger.warn(
        `JWT issuer mismatch: expected=${expectedIssuer} got=${payload.iss}`,
        JwtStrategy.name,
      );
      throw new UnauthorizedException('Invalid token issuer');
    }

    const gotAudience = payload.client_id || payload.aud;
    if (expectedAudience && gotAudience && gotAudience !== expectedAudience) {
      Logger.warn(
        `JWT audience mismatch: expected=${expectedAudience} got=${gotAudience}`,
        JwtStrategy.name,
      );
      throw new UnauthorizedException('Invalid token audience');
    }

    // On accepte principalement l'access token
    if (payload.token_use && payload.token_use !== 'access') {
      Logger.warn(`Invalid token_use: ${payload.token_use}`, JwtStrategy.name);
      // si vous voulez accepter id token aussi, ajuster ici.
      throw new UnauthorizedException('Invalid token_use');
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
