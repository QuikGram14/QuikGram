import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EncryptionService } from '@/common/encryption/encryption.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('WebSocketGateway');
  private userConnections = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      this.userConnections.set(userId, client.id);
      client.join(`user:${userId}`);

      this.logger.log(`Client ${client.id} connected as user ${userId}`);
      this.broadcastUserStatus(userId, true);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.userConnections.entries()).find(
      ([, socketId]) => socketId === client.id,
    )?.[0];

    if (userId) {
      this.userConnections.delete(userId);
      this.broadcastUserStatus(userId, false);
    }

    this.logger.log(`Client ${client.id} disconnected`);
  }

  /**
   * Send message to chat
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(client: Socket, payload: any) {
    const { chatId, content, encrypted } = payload;

    try {
      const token = client.handshake.auth.token;
      const { sub: userId } = this.jwtService.verify(token);

      // Save message to database
      const message = await this.prisma.message.create({
        data: {
          chatId,
          senderId: userId,
          content,
          encrypted: encrypted || undefined,
        },
      });

      // Broadcast to all chat members
      this.server.to(`chat:${chatId}`).emit('messageReceived', {
        id: message.id,
        chatId,
        senderId: userId,
        content,
        encrypted,
        createdAt: message.createdAt,
      });

      return { success: true, messageId: message.id };
    } catch (error) {
      this.logger.error('Send message error:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  /**
   * Join chat
   */
  @SubscribeMessage('joinChat')
  async handleJoinChat(client: Socket, payload: any) {
    const { chatId } = payload;
    client.join(`chat:${chatId}`);
    this.logger.log(`Client ${client.id} joined chat ${chatId}`);
  }

  /**
   * Leave chat
   */
  @SubscribeMessage('leaveChat')
  async handleLeaveChat(client: Socket, payload: any) {
    const { chatId } = payload;
    client.leave(`chat:${chatId}`);
    this.logger.log(`Client ${client.id} left chat ${chatId}`);
  }

  /**
   * User typing indicator
   */
  @SubscribeMessage('userTyping')
  handleUserTyping(client: Socket, payload: any) {
    const { chatId, isTyping } = payload;
    const token = client.handshake.auth.token;

    try {
      const { sub: userId } = this.jwtService.verify(token);

      this.server.to(`chat:${chatId}`).emit('userTyping', {
        userId,
        isTyping,
      });
    } catch (error) {
      this.logger.error('Typing error:', error);
    }
  }

  /**
   * Broadcast user online/offline status
   */
  private async broadcastUserStatus(userId: string, isOnline: boolean) {
    // Update last seen
    if (!isOnline) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
      });
    }

    // Get user's chats
    const chats = await this.prisma.chatUser.findMany({
      where: { userId },
    });

    // Broadcast to all chats user is in
    chats.forEach((chat) => {
      this.server.to(`chat:${chat.chatId}`).emit('userStatus', {
        userId,
        isOnline,
      });
    });
  }
}
