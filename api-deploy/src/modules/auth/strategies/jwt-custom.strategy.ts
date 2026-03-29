import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

interface CustomJwtPayload {
  sub: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtCustomStrategy extends PassportStrategy(Strategy, 'jwt-custom') {
  private logger = new Logger(JwtCustomStrategy.name);

  constructor(
    private config: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = config.get('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is missing in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      algorithms: ['HS256'],
    });

    Logger.log('Custom JWT strategy configured', JwtCustomStrategy.name);
  }

  async validate(payload: CustomJwtPayload) {
    this.logger.log(`[JWT Custom validate] Payload: ${JSON.stringify({
      sub: payload.sub,
      email: payload.email,
      username: payload.username,
    })}`);

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      this.logger.warn(`[JWT Custom] User not found: ${payload.sub}`);
      return null;
    }

    return {
      id: user.id,
      cognitoSub: user.cognitoSub,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }
}
