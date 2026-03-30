import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

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

  // ─── DELETE MESSAGE ──────────────────────────────────────────────────────────

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.conversationMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new ForbiddenException('Message introuvable');
    }

    // Only author can delete their own message (or system messages cannot be deleted)
    if (message.type === 'SYSTEM') {
      throw new ForbiddenException('Les messages système ne peuvent pas être supprimés');
    }

    if (!message.authorId || message.authorId !== userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres messages');
    }

    // If message has an image, delete it from Cloudinary
    if (message.type === 'IMAGE' && message.imageUrl) {
      try {
        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
        const urlParts = message.imageUrl.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          // Get everything after 'upload/v{version}/'
          const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');
          // Remove file extension
          const publicId = pathAfterVersion.replace(/\.[^/.]+$/, '');
          
          this.logger.log(`Deleting image from Cloudinary: ${publicId}`);
          await cloudinary.uploader.destroy(publicId);
          this.logger.log(`Image deleted successfully from Cloudinary`);
        }
      } catch (error) {
        this.logger.error(`Failed to delete image from Cloudinary: ${error.message}`);
        // Continue with message deletion even if Cloudinary deletion fails
      }
    }

    await this.prisma.conversationMessage.delete({
      where: { id: messageId },
    });

    return { message: 'Message supprimé avec succès' };
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
