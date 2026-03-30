import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtDualGuard extends AuthGuard(['jwt', 'jwt-custom']) {
  private logger = new Logger(JwtDualGuard.name);

  getRequest(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const bodyToken = req?.body?.idToken;

    // Support token in body for compatibility
    if (!req.headers.authorization && typeof bodyToken === 'string' && bodyToken.length > 0) {
      req.headers.authorization = `Bearer ${bodyToken}`;
    }

    return req;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      this.logger.warn(`Authentication failed: ${info?.message || err?.message || 'Unknown error'}`);
      throw err || new UnauthorizedException('Token invalide ou expiré');
    }
    return user;
  }
}
