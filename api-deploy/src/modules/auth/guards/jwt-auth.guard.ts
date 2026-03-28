import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: any) {
    const req = context.switchToHttp().getRequest();
    const bodyToken = req?.body?.idToken;

    if (!req.headers.authorization && typeof bodyToken === 'string' && bodyToken.length > 0) {
      req.headers.authorization = `Bearer ${bodyToken}`;
    }

    return req;
  }
}
