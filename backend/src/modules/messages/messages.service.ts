import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getChatMessages(chatId: string, userId: string, page: number = 1, limit: number = 50) {
    // Verify user is member of chat
    const chatUser = await this.prisma.chatUser.findUnique({
      where: {
        chatId_userId: { chatId, userId },
      },
    });

    if (!chatUser) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    const messages = await this.prisma.message.findMany({
      where: { chatId },
      include: { reactions: true, attachments: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return messages;
  }

  async editMessage(messageId: string, userId: string, content: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true },
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    return this.prisma.reaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
    });
  }

  async removeReaction(messageId: string, userId: string) {
    return this.prisma.reaction.deleteMany({
      where: {
        messageId,
        userId,
      },
    });
  }
}
