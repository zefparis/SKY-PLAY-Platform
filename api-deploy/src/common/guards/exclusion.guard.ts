import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const EXCLUDED_PATHS = [
  '/auth',
  '/users/self-exclude/status',
  '/users/device',
  '/health',
  '/wallet/webhook',
];

@Injectable()
export class ExclusionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) return true;

    const path: string = request.path ?? '';
    const isExcluded = EXCLUDED_PATHS.some((p) => path.startsWith(p));
    if (isExcluded) return true;

    const dbUser = await (this.prisma.user as any).findUnique({
      where: { id: user.id },
      select: { exclusionStatus: true, exclusionUntil: true } as any,
    }) as { exclusionStatus: string; exclusionUntil: Date | null } | null;

    if (!dbUser) return true;

    if (dbUser.exclusionStatus === 'ACTIVE') return true;

    if (dbUser.exclusionStatus === 'PERMANENTLY_EXCLUDED') {
      throw new ForbiddenException(
        'Votre compte a été définitivement fermé. Pour toute question : support@skyplay.cm',
      );
    }

    const now = new Date();

    if (
      (dbUser.exclusionStatus === 'COOLING_OFF' ||
        dbUser.exclusionStatus === 'SELF_EXCLUDED') &&
      dbUser.exclusionUntil &&
      dbUser.exclusionUntil <= now
    ) {
      await (this.prisma.user as any).update({
        where: { id: user.id },
        data: { exclusionStatus: 'ACTIVE', exclusionUntil: null, exclusionReason: null } as any,
      });
      return true;
    }

    if (
      dbUser.exclusionStatus === 'COOLING_OFF' ||
      dbUser.exclusionStatus === 'SELF_EXCLUDED'
    ) {
      const until = dbUser.exclusionUntil
        ? dbUser.exclusionUntil.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'une date indéfinie';
      throw new ForbiddenException(
        `Votre compte est temporairement suspendu jusqu'au ${until}.`,
      );
    }

    return true;
  }
}
