import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ChallengesService } from './challenges.service';

const INVITE_TTL_SECONDS = 60;

@Injectable()
export class ChallengeInviteService {
  private server: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly challengesService: ChallengesService,
  ) {}

  setServer(server: any) {
    this.server = server;
  }

  private emit(userId: string, event: string, data: any) {
    this.server?.to(`user_${userId}`).emit(event, data);
  }

  // ─── CREATE INVITE ────────────────────────────────────────────────────────────

  async createInvite(fromUserId: string, challengeId: string, toUserId: string) {
    const challenge = await this.challengesService.findOne(challengeId);

    if (challenge.type !== 'DUEL') {
      throw new BadRequestException('Les invitations nominatives ne sont disponibles que pour les DUEL 1v1');
    }
    if (challenge.status !== 'OPEN') {
      throw new BadRequestException('Ce défi n\'est plus ouvert aux inscriptions');
    }
    if (challenge.creatorId !== fromUserId) {
      throw new ForbiddenException('Seul le créateur du défi peut envoyer des invitations');
    }
    if (fromUserId === toUserId) {
      throw new BadRequestException('Vous ne pouvez pas vous inviter vous-même');
    }

    const existing = await this.prisma.challengeInvite.findFirst({
      where: { challengeId, status: 'PENDING' },
    });
    if (existing) {
      throw new BadRequestException('Une invitation est déjà en attente pour ce défi');
    }

    const expiresAt = new Date(Date.now() + INVITE_TTL_SECONDS * 1000);

    const invite = await this.prisma.challengeInvite.create({
      data: { challengeId, fromUserId, toUserId, status: 'PENDING', expiresAt },
      include: {
        fromUser: { select: { id: true, username: true, avatar: true } },
        challenge: { select: { id: true, title: true, game: true, entryFee: true, type: true } },
      },
    });

    this.emit(toUserId, 'challenge_invite', {
      inviteId: invite.id,
      challengeId,
      fromUser: invite.fromUser,
      challenge: invite.challenge,
      expiresAt: invite.expiresAt,
    });

    return invite;
  }

  // ─── RESPOND TO INVITE ────────────────────────────────────────────────────────

  async respondToInvite(toUserId: string, inviteId: string, accept: boolean) {
    const invite = await this.prisma.challengeInvite.findUnique({
      where: { id: inviteId },
      include: {
        fromUser: { select: { id: true, username: true, avatar: true } },
        toUser:   { select: { id: true, username: true, avatar: true } },
      },
    });

    if (!invite) throw new NotFoundException('Invitation introuvable');
    if (invite.toUserId !== toUserId) throw new ForbiddenException('Cette invitation ne vous est pas destinée');
    if (invite.status !== 'PENDING') {
      throw new BadRequestException(`Invitation déjà traitée (statut : ${invite.status})`);
    }

    if (invite.expiresAt < new Date()) {
      await this.prisma.challengeInvite.update({ where: { id: inviteId }, data: { status: 'EXPIRED' } });
      this.emit(invite.fromUserId, 'invite_expired', { inviteId, challengeId: invite.challengeId });
      this.emit(invite.toUserId,   'invite_expired', { inviteId, challengeId: invite.challengeId });
      throw new BadRequestException('Cette invitation a expiré (60 secondes dépassées)');
    }

    if (accept) {
      await this.challengesService.join(invite.challengeId, toUserId);
      await this.prisma.challengeInvite.update({ where: { id: inviteId }, data: { status: 'ACCEPTED' } });
      return { accepted: true };
    } else {
      await this.prisma.challengeInvite.update({ where: { id: inviteId }, data: { status: 'DECLINED' } });
      this.emit(invite.fromUserId, 'invite_declined', {
        inviteId,
        challengeId: invite.challengeId,
        toUser: invite.toUser,
      });
      return { accepted: false };
    }
  }

  // ─── GET PENDING INVITES ──────────────────────────────────────────────────────

  async getPendingInvites(userId: string) {
    return this.prisma.challengeInvite.findMany({
      where: { toUserId: userId, status: 'PENDING', expiresAt: { gt: new Date() } },
      include: {
        fromUser: { select: { id: true, username: true, avatar: true } },
        challenge: { select: { id: true, title: true, game: true, entryFee: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── CRON: EXPIRE INVITES ─────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_MINUTE)
  async expireInvites() {
    const expired = await this.prisma.challengeInvite.findMany({
      where: { status: 'PENDING', expiresAt: { lt: new Date() } },
    });

    if (expired.length === 0) return;

    await this.prisma.challengeInvite.updateMany({
      where: { id: { in: expired.map((i) => i.id) } },
      data: { status: 'EXPIRED' },
    });

    for (const inv of expired) {
      this.emit(inv.fromUserId, 'invite_expired', { inviteId: inv.id, challengeId: inv.challengeId });
      this.emit(inv.toUserId,   'invite_expired', { inviteId: inv.id, challengeId: inv.challengeId });
    }
  }
}
