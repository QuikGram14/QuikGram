import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateChatDto, UpdateChatDto, AddUserToChatDto } from './dto';
import { ChatType } from '@prisma/client';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create private chat (1-to-1)
   */
  async createPrivateChat(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('You cannot create a chat with yourself');
    }

    // Check if chat already exists
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        type: ChatType.PRIVATE,
        users: {
          every: {
            userId: { in: [userId, targetUserId] },
          },
        },
      },
    });

    if (existingChat) {
      return existingChat;
    }

    // Create new private chat
    return this.prisma.chat.create({
      data: {
        type: ChatType.PRIVATE,
        isEncrypted: true,
        users: {
          createMany: {
            data: [{ userId }, { userId: targetUserId }],
          },
        },
      },
      include: { users: true },
    });
  }

  /**
   * Create group chat
   */
  async createGroupChat(userId: string, createChatDto: CreateChatDto) {
    const { name, description, members } = createChatDto;

    const chat = await this.prisma.chat.create({
      data: {
        type: ChatType.GROUP,
        name,
        description,
        groupOwnerId: userId,
        isEncrypted: true,
        users: {
          createMany: {
            data: [
              { userId },
              ...members.map((memberId) => ({ userId: memberId })),
            ],
          },
        },
      },
      include: { users: true },
    });

    // Set creator as admin
    await this.prisma.groupRole.create({
      data: {
        userId,
        chatId: chat.id,
        role: 'ADMIN',
        canWrite: true,
        canDeleteMsg: true,
        canManageUsers: true,
        canPinMsg: true,
      },
    });

    return chat;
  }

  /**
   * Get user's chats
   */
  async getUserChats(userId: string) {
    return this.prisma.chat.findMany({
      where: {
        users: {
          some: { userId },
        },
        deletedAt: null,
      },
      include: {
        users: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Get chat details
   */
  async getChatById(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        users: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Check if user is a member
    const isMember = chat.users.some((u) => u.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    return chat;
  }

  /**
   * Update chat
   */
  async updateChat(chatId: string, userId: string, updateChatDto: UpdateChatDto) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Only group owner can update
    if (chat.type === ChatType.GROUP && chat.groupOwnerId !== userId) {
      throw new ForbiddenException('Only group owner can update chat');
    }

    return this.prisma.chat.update({
      where: { id: chatId },
      data: updateChatDto,
      include: { users: true },
    });
  }

  /**
   * Add user to group chat
   */
  async addUserToChat(chatId: string, userId: string, addUserToChatDto: AddUserToChatDto) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat || chat.type !== ChatType.GROUP) {
      throw new NotFoundException('Group chat not found');
    }

    // Check if caller is admin/owner
    const userRole = await this.prisma.groupRole.findFirst({
      where: { chatId, userId },
    });

    if (!userRole || (userRole.role !== 'ADMIN' && userRole.role !== 'OWNER')) {
      throw new ForbiddenException('Only admins can add members');
    }

    // Add user to chat
    return this.prisma.chatUser.create({
      data: {
        chatId,
        userId: addUserToChatDto.targetUserId,
      },
    });
  }

  /**
   * Remove user from chat
   */
  async removeUserFromChat(chatId: string, userId: string, targetUserId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat || chat.type !== ChatType.GROUP) {
      throw new NotFoundException('Group chat not found');
    }

    // Check permissions
    if (userId !== targetUserId) {
      const userRole = await this.prisma.groupRole.findFirst({
        where: { chatId, userId },
      });

      if (!userRole || (userRole.role !== 'ADMIN' && userRole.role !== 'OWNER')) {
        throw new ForbiddenException('Only admins can remove members');
      }
    }

    return this.prisma.chatUser.delete({
      where: {
        chatId_userId: {
          chatId,
          userId: targetUserId,
        },
      },
    });
  }

  /**
   * Leave chat
   */
  async leaveChat(chatId: string, userId: string) {
    return this.removeUserFromChat(chatId, userId, userId);
  }

  /**
   * Mark chat as read
   */
  async markAsRead(chatId: string, userId: string) {
    return this.prisma.chatUser.update({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
        unreadCount: 0,
      },
    });
  }

  /**
   * Archive chat
   */
  async archiveChat(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return this.prisma.chatUser.update({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },
      data: {
        // archiveAt: new Date(),
      },
    });
  }
}
