import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwksRsa from 'jwks-rsa';
import { verify } from 'jsonwebtoken';
import { CognitoJwtPayload } from '../../common/types/cognito-jwt-payload';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';

interface ConnectedUser {
  id: string;
  cognitoSub: string;
  username: string;
  email: string;
  socketId: string;
  avatar?: string;
}

interface Message {
  id: string;
  room: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  timestamp: Date;
}

interface PrivateMessage {
  id: string;
  content: string;
  from: {
    id: string;
    username: string;
  };
  to: {
    id: string;
    username: string;
  };
  timestamp: Date;
}

interface VoiceUser {
  socketId: string;
  userId: string;
  username: string;
  avatar?: string;
  muted: boolean;
  speaking: boolean;
}

const AVAILABLE_ROOMS = ['global', 'fr', 'en'];
const VOICE_ROOMS = ['voice_global', 'voice_fr', 'voice_en'];
const MAX_MESSAGE_LENGTH = 500;
const RATE_LIMIT_MS = 1000;
const MAX_VOICE_USERS = 10;

@WebSocketGateway({
  cors: {
    origin: ['https://sky-play-platform.vercel.app', 'http://localhost:3000'],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, ConnectedUser>();
  private userLastMessage = new Map<string, number>();
  private voiceRooms = new Map<string, Map<string, VoiceUser>>();
  private userLastVoiceAction = new Map<string, number>();
  private jwksClient: jwksRsa.JwksClient;

  constructor(
    private config: ConfigService,
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {
    const cognito = config.get('cognito');
    const jwksUri = cognito?.jwksUri;

    if (!jwksUri) {
      throw new Error('Cognito JWKS URI is missing');
    }

    this.jwksClient = jwksRsa({
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      jwksUri,
    });
  }

  private async verifyToken(token: string): Promise<CognitoJwtPayload> {
    const cognito = this.config.get('cognito');
    const issuer = cognito?.issuer;
    const audience = cognito?.clientId;

    return new Promise((resolve, reject) => {
      const decoded = verify(
        token,
        (header, callback) => {
          this.jwksClient.getSigningKey(header.kid, (err, key) => {
            if (err) {
              callback(err);
              return;
            }
            const signingKey = key.getPublicKey();
            callback(null, signingKey);
          });
        },
        {
          issuer,
          audience,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded as CognitoJwtPayload);
          }
        },
      );
    });
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        this.logger.warn(`Connection rejected: no token provided`);
        client.disconnect();
        return;
      }

      const payload = await this.verifyToken(token);
      const cognitoSub = payload.sub;
      const email = payload.email;
      const username = payload.username || payload.email?.split('@')[0] || payload.sub;

      const user = await this.usersService.findOrCreateFromCognito({
        cognitoSub,
        email,
        username,
      });

      const connectedUser: ConnectedUser = {
        id: user.id,
        cognitoSub,
        username: user.username,
        email: user.email,
        socketId: client.id,
        avatar: user.avatar || undefined,
      };

      this.connectedUsers.set(client.id, connectedUser);

      client.join('global');

      // Mettre à jour le statut à ONLINE
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: 'ONLINE' },
      });

      this.logger.log(`User ${user.username} (${user.id}) connected to chat`);

      // Émettre le changement de statut aux amis connectés
      await this.emitStatusChangeToFriends(user.id, 'ONLINE');

      this.emitRoomUsers('global');

      client.emit('connected', {
        userId: user.id,
        username: user.username,
        rooms: ['global'],
      });
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = this.connectedUsers.get(client.id);

    if (user) {
      this.logger.log(`User ${user.username} disconnected from chat`);

      const rooms = Array.from(client.rooms).filter((room) => room !== client.id);
      rooms.forEach((room) => {
        this.server.to(room).emit('user_left', {
          room,
          user: {
            id: user.id,
            username: user.username,
          },
        });
      });

      // Mettre à jour le statut à OFFLINE et lastSeen
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'OFFLINE',
          lastSeen: new Date(),
        },
      });

      // Émettre le changement de statut aux amis connectés
      await this.emitStatusChangeToFriends(user.id, 'OFFLINE');

      // Retirer l'utilisateur de tous les salons vocaux
      this.removeUserFromAllVoiceRooms(client.id);

      this.connectedUsers.delete(client.id);
      this.userLastMessage.delete(user.id);

      rooms.forEach((room) => this.emitRoomUsers(room));
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);

    if (!user) {
      return;
    }

    const { room } = data;

    if (!AVAILABLE_ROOMS.includes(room) && !room.startsWith('challenge_')) {
      client.emit('error', { message: 'Invalid room' });
      return;
    }

    client.join(room);

    this.server.to(room).emit('user_joined', {
      room,
      user: {
        id: user.id,
        username: user.username,
      },
    });

    this.emitRoomUsers(room);

    this.logger.log(`User ${user.username} joined room ${room}`);
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);

    if (!user) {
      return;
    }

    const { room } = data;

    if (room === 'global') {
      client.emit('error', { message: 'Cannot leave global room' });
      return;
    }

    client.leave(room);

    this.server.to(room).emit('user_left', {
      room,
      user: {
        id: user.id,
        username: user.username,
      },
    });

    this.emitRoomUsers(room);

    this.logger.log(`User ${user.username} left room ${room}`);
  }

  @SubscribeMessage('send_message')
  handleSendMessage(
    @MessageBody() data: { room: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);

    if (!user) {
      return;
    }

    const { room, content } = data;

    if (!content || content.trim().length === 0) {
      client.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      client.emit('error', { message: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` });
      return;
    }

    const now = Date.now();
    const lastMessageTime = this.userLastMessage.get(user.id) || 0;

    if (now - lastMessageTime < RATE_LIMIT_MS) {
      client.emit('error', { message: 'Please wait before sending another message' });
      return;
    }

    this.userLastMessage.set(user.id, now);

    const message: Message = {
      id: `${user.id}-${now}`,
      room,
      content: content.trim(),
      author: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
      timestamp: new Date(),
    };

    this.server.to(room).emit('message', message);

    this.logger.log(`Message from ${user.username} in ${room}: ${content.substring(0, 50)}...`);
  }

  @SubscribeMessage('send_private')
  handleSendPrivate(
    @MessageBody() data: { toUserId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const fromUser = this.connectedUsers.get(client.id);

    if (!fromUser) {
      return;
    }

    const { toUserId, content } = data;

    if (!content || content.trim().length === 0) {
      client.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      client.emit('error', { message: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` });
      return;
    }

    const now = Date.now();
    const lastMessageTime = this.userLastMessage.get(fromUser.id) || 0;

    if (now - lastMessageTime < RATE_LIMIT_MS) {
      client.emit('error', { message: 'Please wait before sending another message' });
      return;
    }

    this.userLastMessage.set(fromUser.id, now);

    const toUser = Array.from(this.connectedUsers.values()).find((u) => u.id === toUserId);

    if (!toUser) {
      client.emit('error', { message: 'User not found or offline' });
      return;
    }

    const privateMessage: PrivateMessage = {
      id: `${fromUser.id}-${toUserId}-${now}`,
      content: content.trim(),
      from: {
        id: fromUser.id,
        username: fromUser.username,
      },
      to: {
        id: toUser.id,
        username: toUser.username,
      },
      timestamp: new Date(),
    };

    this.server.to(toUser.socketId).emit('private_message', privateMessage);
    client.emit('private_message', privateMessage);

    this.logger.log(`Private message from ${fromUser.username} to ${toUser.username}`);
  }

  private emitRoomUsers(room: string) {
    this.server.in(room).fetchSockets().then((sockets) => {
      const users = sockets
        .map((socket) => this.connectedUsers.get(socket.id))
        .filter((user) => user !== undefined)
        .map((user) => ({
          id: user.id,
          username: user.username,
          avatar: user.avatar,
        }));

      this.server.to(room).emit('room_users', { room, users });
    });
  }

  private async emitStatusChangeToFriends(userId: string, status: string) {
    try {
      // Récupérer les amis du user
      const friendships = await this.prisma.friendship.findMany({
        where: {
          OR: [
            { senderId: userId, status: 'ACCEPTED' },
            { receiverId: userId, status: 'ACCEPTED' },
          ],
        },
        select: {
          senderId: true,
          receiverId: true,
        },
      });

      const friendIds = friendships.map((f) =>
        f.senderId === userId ? f.receiverId : f.senderId,
      );

      // Trouver les sockets des amis connectés
      const connectedFriendSockets = Array.from(this.connectedUsers.entries())
        .filter(([_, user]) => friendIds.includes(user.id))
        .map(([socketId]) => socketId);

      // Émettre le changement de statut à chaque ami connecté
      connectedFriendSockets.forEach((socketId) => {
        this.server.to(socketId).emit('status_change', {
          userId,
          status,
        });
      });

      this.logger.log(`Status change emitted to ${connectedFriendSockets.length} friends`);
    } catch (error) {
      this.logger.error(`Failed to emit status change: ${error.message}`);
    }
  }

  // ===== VOICE CHAT HANDLERS =====

  @SubscribeMessage('voice_join')
  handleVoiceJoin(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const { room } = data;

    // Rate limiting
    const now = Date.now();
    const lastAction = this.userLastVoiceAction.get(user.id) || 0;
    if (now - lastAction < 1000) {
      client.emit('error', { message: 'Too many voice actions' });
      return;
    }
    this.userLastVoiceAction.set(user.id, now);

    // Validate room
    if (!VOICE_ROOMS.includes(room) && !room.startsWith('voice_match_')) {
      client.emit('error', { message: 'Invalid voice room' });
      return;
    }

    // Initialize room if needed
    if (!this.voiceRooms.has(room)) {
      this.voiceRooms.set(room, new Map());
    }

    const voiceRoom = this.voiceRooms.get(room);

    // Check max users
    if (voiceRoom.size >= MAX_VOICE_USERS) {
      client.emit('error', { message: 'Voice room is full' });
      return;
    }

    // Add user to voice room
    const voiceUser: VoiceUser = {
      socketId: client.id,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      muted: false,
      speaking: false,
    };

    voiceRoom.set(client.id, voiceUser);
    client.join(room);

    // Notify existing users about new user
    client.to(room).emit('voice_user_joined', {
      socketId: client.id,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
    });

    // Send current room users to the new user
    const roomUsers = Array.from(voiceRoom.values());
    client.emit('voice_room_users', { room, users: roomUsers });

    this.logger.log(`User ${user.username} joined voice room ${room}`);
  }

  @SubscribeMessage('voice_leave')
  handleVoiceLeave(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const { room } = data;
    this.removeUserFromVoiceRoom(client.id, room);
  }

  @SubscribeMessage('voice_offer')
  handleVoiceOffer(
    @MessageBody() data: { targetSocketId: string; offer: any },
    @ConnectedSocket() client: Socket,
  ) {
    const { targetSocketId, offer } = data;
    this.server.to(targetSocketId).emit('voice_offer', {
      fromSocketId: client.id,
      offer,
    });
  }

  @SubscribeMessage('voice_answer')
  handleVoiceAnswer(
    @MessageBody() data: { targetSocketId: string; answer: any },
    @ConnectedSocket() client: Socket,
  ) {
    const { targetSocketId, answer } = data;
    this.server.to(targetSocketId).emit('voice_answer', {
      fromSocketId: client.id,
      answer,
    });
  }

  @SubscribeMessage('voice_ice_candidate')
  handleVoiceIceCandidate(
    @MessageBody() data: { targetSocketId: string; candidate: any },
    @ConnectedSocket() client: Socket,
  ) {
    const { targetSocketId, candidate } = data;
    this.server.to(targetSocketId).emit('voice_ice_candidate', {
      fromSocketId: client.id,
      candidate,
    });
  }

  @SubscribeMessage('voice_speaking')
  handleVoiceSpeaking(
    @MessageBody() data: { room: string; speaking: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const { room, speaking } = data;
    const voiceRoom = this.voiceRooms.get(room);
    if (!voiceRoom) return;

    const voiceUser = voiceRoom.get(client.id);
    if (voiceUser) {
      voiceUser.speaking = speaking;
      client.to(room).emit('voice_speaking', {
        userId: user.id,
        speaking,
      });
    }
  }

  @SubscribeMessage('voice_mute')
  handleVoiceMute(
    @MessageBody() data: { room: string; muted: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const { room, muted } = data;
    const voiceRoom = this.voiceRooms.get(room);
    if (!voiceRoom) return;

    const voiceUser = voiceRoom.get(client.id);
    if (voiceUser) {
      voiceUser.muted = muted;
      client.to(room).emit('voice_mute_update', {
        userId: user.id,
        muted,
      });
    }
  }

  private removeUserFromVoiceRoom(socketId: string, room: string) {
    const voiceRoom = this.voiceRooms.get(room);
    if (!voiceRoom) return;

    const voiceUser = voiceRoom.get(socketId);
    if (voiceUser) {
      voiceRoom.delete(socketId);
      this.server.to(room).emit('voice_user_left', {
        socketId,
        userId: voiceUser.userId,
      });

      // Clean up empty rooms
      if (voiceRoom.size === 0) {
        this.voiceRooms.delete(room);
      }

      this.logger.log(`User ${voiceUser.username} left voice room ${room}`);
    }
  }

  private removeUserFromAllVoiceRooms(socketId: string) {
    this.voiceRooms.forEach((voiceRoom, room) => {
      if (voiceRoom.has(socketId)) {
        this.removeUserFromVoiceRoom(socketId, room);
      }
    });
  }
}
