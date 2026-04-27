import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FriendshipStatus } from '@prisma/client';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class FriendshipsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.BLOCKED) {
        throw new BadRequestException('Cannot send friend request to blocked user');
      }
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        throw new BadRequestException('Already friends');
      }
      if (existingFriendship.status === FriendshipStatus.PENDING) {
        throw new BadRequestException('Friend request already sent');
      }
    }

    const friendship = await this.prisma.friendship.create({
      data: {
        senderId,
        receiverId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    const notifRequest = await this.prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'FRIEND_REQUEST',
        title: 'Nouvelle demande d\'ami',
        body: `${friendship.sender.username} vous a envoyé une demande d'ami`,
        data: {
          senderId,
          senderUsername: friendship.sender.username,
          senderAvatar: friendship.sender.avatar,
        },
      },
    });
    this.chatGateway.pushNotification(receiverId, notifRequest);

    // Emit Socket.io event to receiver
    this.chatGateway.emitFriendRequest(receiverId, {
      from: {
        id: friendship.sender.id,
        username: friendship.sender.username,
        avatar: friendship.sender.avatar,
      },
    });

    return friendship;
  }

  async acceptFriendRequest(userId: string, senderId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        senderId,
        receiverId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    const updated = await this.prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: FriendshipStatus.ACCEPTED },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    const notifAccepted = await this.prisma.notification.create({
      data: {
        userId: senderId,
        type: 'FRIEND_ACCEPTED',
        title: 'Demande d\'ami acceptée',
        body: `${friendship.receiver.username} a accepté votre demande d'ami`,
        data: {
          userId,
          username: friendship.receiver.username,
          avatar: friendship.receiver.avatar,
        },
      },
    });

    this.chatGateway.pushNotification(senderId, notifAccepted);

    // Emit Socket.io event to sender
    this.chatGateway.emitFriendAccepted(senderId, {
      user: {
        id: friendship.receiver.id,
        username: friendship.receiver.username,
        avatar: friendship.receiver.avatar,
      },
    });

    return updated;
  }

  /**
   * Sender cancels their own PENDING outgoing friend request.
   * userId  = the sender (current authenticated user)
   * targetUserId = the user they originally sent the request to
   */
  async cancelFriendRequest(userId: string, targetUserId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        senderId: userId,
        receiverId: targetUserId,
        status: FriendshipStatus.PENDING,
      },
    });

    if (!friendship) {
      throw new NotFoundException('No pending friend request to cancel');
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return { message: 'Friend request cancelled' };
  }

  async declineFriendRequest(userId: string, senderId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        senderId,
        receiverId: userId,
        status: FriendshipStatus.PENDING,
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return { message: 'Friend request declined' };
  }

  async removeFriend(userId: string, friendId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId, status: FriendshipStatus.ACCEPTED },
          { senderId: friendId, receiverId: userId, status: FriendshipStatus.ACCEPTED },
        ],
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return { message: 'Friend removed' };
  }

  async blockUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: userId },
        ],
      },
    });

    if (existingFriendship) {
      await this.prisma.friendship.delete({
        where: { id: existingFriendship.id },
      });
    }

    const blocked = await this.prisma.friendship.create({
      data: {
        senderId: userId,
        receiverId: targetUserId,
        status: FriendshipStatus.BLOCKED,
      },
    });

    return blocked;
  }

  async unblockUser(userId: string, targetUserId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        senderId: userId,
        receiverId: targetUserId,
        status: FriendshipStatus.BLOCKED,
      },
    });

    if (!friendship) {
      throw new NotFoundException('Block not found');
    }

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return { message: 'User unblocked' };
  }

  async getFriends(userId: string, limit = 50, offset = 0) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: FriendshipStatus.ACCEPTED },
          { receiverId: userId, status: FriendshipStatus.ACCEPTED },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
            status: true,
            lastSeen: true,
            level: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
            status: true,
            lastSeen: true,
            level: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return friendships.map((f) => {
      const friend = f.senderId === userId ? f.receiver : f.sender;
      return {
        ...friend,
        friendshipId: f.id,
        friendsSince: f.createdAt,
      };
    });
  }

  async getPendingRequests(userId: string, limit = 50, offset = 0) {
    const requests = await this.prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
            level: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      ...r.sender,
      requestId: r.id,
      requestedAt: r.createdAt,
    }));
  }

  async getSuggestions(userId: string, limit = 10) {
    const recentOpponents = await this.prisma.matchResult.findMany({
      where: {
        userId,
      },
      select: {
        match: {
          select: {
            results: {
              where: {
                userId: { not: userId },
              },
              select: {
                userId: true,
              },
            },
          },
        },
      },
      take: 50,
    });

    const opponentIds = Array.from(
      new Set(
        recentOpponents.flatMap((r) => r.match.results.map((res) => res.userId)),
      ),
    );

    const existingFriendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: opponentIds } },
          { senderId: { in: opponentIds }, receiverId: userId },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });

    const friendIds = new Set(
      existingFriendships.flatMap((f) => [f.senderId, f.receiverId]),
    );
    friendIds.add(userId);

    const suggestions = await this.prisma.user.findMany({
      where: {
        id: {
          in: opponentIds.filter((id) => !friendIds.has(id)),
        },
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        level: true,
        gamesPlayed: true,
        gamesWon: true,
      },
      take: limit,
    });

    return suggestions;
  }

  async getFriendshipStatus(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      return { status: 'SELF' };
    }

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: userId },
        ],
      },
    });

    if (!friendship) {
      return { status: 'NONE' };
    }

    if (friendship.status === FriendshipStatus.BLOCKED) {
      return {
        status: 'BLOCKED',
        blockedBy: friendship.senderId === userId ? 'YOU' : 'THEM',
      };
    }

    if (friendship.status === FriendshipStatus.PENDING) {
      return {
        status: 'PENDING',
        sentBy: friendship.senderId === userId ? 'YOU' : 'THEM',
      };
    }

    return { status: 'ACCEPTED' };
  }
}
