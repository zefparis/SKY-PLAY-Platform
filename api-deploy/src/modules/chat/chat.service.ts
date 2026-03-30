import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // ─── DM ──────────────────────────────────────────────────────────────────────

  async getOrCreateDm(userId1: string, userId2: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'DM',
        AND: [
          { members: { some: { userId: userId1 } } },
          { members: { some: { userId: userId2 } } },
        ],
      },
      include: this.conversationInclude(userId1),
    });
    if (existing) return this.withUnread(existing, userId1);

    const created = await this.prisma.conversation.create({
      data: {
        type: 'DM',
        members: { create: [{ userId: userId1 }, { userId: userId2 }] },
      },
      include: this.conversationInclude(userId1),
    });
    return this.withUnread(created, userId1);
  }

  // ─── LIST CONVERSATIONS ───────────────────────────────────────────────────────

  async getUserConversations(userId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      include: this.conversationInclude(userId),
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(convs.map((c) => this.withUnread(c, userId)));
  }

  // ─── MESSAGES ────────────────────────────────────────────────────────────────

  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
    const member = await this.prisma.conversationMember.findFirst({
      where: { conversationId, userId },
    });
    if (!member) throw new ForbiddenException('Not a member of this conversation');

    return this.prisma.conversationMessage.findMany({
      where: { conversationId },
      include: { author: { select: { id: true, username: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  // ─── SAVE MESSAGE ────────────────────────────────────────────────────────────

  async saveMessage(
    conversationId: string,
    authorId: string | null,
    content: string,
    type: 'TEXT' | 'IMAGE' | 'SYSTEM',
    imageUrl?: string,
  ) {
    const msg = await this.prisma.conversationMessage.create({
      data: { conversationId, authorId, content, type, imageUrl },
      include: { author: { select: { id: true, username: true, avatar: true } } },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return msg;
  }

  // ─── CHALLENGE CONVERSATION ───────────────────────────────────────────────────

  async createChallengeConversation(challengeId: string, participantIds: string[]) {
    const existing = await this.prisma.conversation.findFirst({
      where: { challengeId },
    });
    if (existing) return existing;

    const conv = await this.prisma.conversation.create({
      data: {
        type: 'CHALLENGE',
        challengeId,
        members: { create: participantIds.map((userId) => ({ userId })) },
      },
    });

    await this.prisma.conversationMessage.create({
      data: {
        conversationId: conv.id,
        content: '⚔️ Le défi a commencé ! Coordonnez-vous ici.',
        type: 'SYSTEM',
      },
    });

    return conv;
  }

  // ─── MARK AS READ ────────────────────────────────────────────────────────────

  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.conversationMember.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });
  }

  // ─── SEARCH USERS ────────────────────────────────────────────────────────────

  async searchUsers(query: string, currentUserId: string) {
    return this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: { id: true, username: true, avatar: true, status: true },
      take: 20,
    });
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  private conversationInclude(userId: string) {
    return {
      members: {
        include: {
          user: { select: { id: true, username: true, avatar: true, status: true } },
        },
      },
      messages: { orderBy: { createdAt: 'desc' as const }, take: 1 },
      challenge: { select: { id: true, title: true, game: true, status: true } },
    };
  }

  private async withUnread(conv: any, userId: string) {
    const member = conv.members?.find((m: any) => m.userId === userId);
    const unreadCount = await this.prisma.conversationMessage.count({
      where: {
        conversationId: conv.id,
        createdAt: { gt: member?.lastReadAt ?? new Date(0) },
        authorId: { not: userId },
      },
    });
    return { ...conv, unreadCount };
  }
}
