import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly jwks;
  private readonly issuer: string;
  private readonly clientId: string;

  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'cognito-jwt-verified-in-validate',
      passReqToCallback: true,
    });

    const region = config.get<string>('AWS_COGNITO_REGION');
    const userPoolId = config.get<string>('AWS_COGNITO_USER_POOL_ID');
    this.clientId = config.get<string>('AWS_COGNITO_CLIENT_ID') || '';

    if (!region || !userPoolId || !this.clientId) {
      throw new Error('Missing Cognito backend configuration');
    }

    this.issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
  }

  async validate(req: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req as any);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const verified = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
      });

      const claims = verified.payload as Record<string, any>;
      const tokenUse = claims.token_use;
      const email = typeof claims.email === 'string' ? claims.email : undefined;
      const username = typeof claims['cognito:username'] === 'string' ? claims['cognito:username'] : undefined;
      const audience = typeof claims.aud === 'string' ? claims.aud : undefined;
      const clientId = typeof claims.client_id === 'string' ? claims.client_id : undefined;

      if (tokenUse !== 'id' && tokenUse !== 'access') {
        throw new UnauthorizedException('Unsupported Cognito token use');
      }

      if ((audience && audience !== this.clientId) || (clientId && clientId !== this.clientId)) {
        throw new UnauthorizedException('Invalid Cognito client');
      }

      const resolvedEmail = email || username;
      if (!resolvedEmail) {
        throw new UnauthorizedException('No email found in Cognito token');
      }

      const user = await this.authService.resolveCognitoUser(resolvedEmail);

      return {
        ...user,
        cognitoSub: claims.sub,
        cognitoUsername: username,
        tokenUse,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Cognito token');
    }
  }
}
