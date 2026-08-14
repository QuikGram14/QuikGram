import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getUsers(limit: number = 50) {
    return this.prisma.user.findMany({
      select: {
        id: true,
        phoneNumber: true,
        username: true,
        displayName: true,
        isActive: true,
        isBlocked: true,
        isVerified: true,
        createdAt: true,
      },
      take: limit,
    });
  }

  async getUserStats() {
    const totalUsers = await this.prisma.user.count();
    const activeUsers = await this.prisma.user.count({
      where: { isActive: true },
    });
    const blockedUsers = await this.prisma.user.count({
      where: { isBlocked: true },
    });

    return { totalUsers, activeUsers, blockedUsers };
  }

  async getChatsStats() {
    const totalChats = await this.prisma.chat.count();
    const totalMessages = await this.prisma.message.count();

    return { totalChats, totalMessages };
  }

  async getModerationLogs(limit: number = 50) {
    return this.prisma.moderationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getAuditLogs(limit: number = 50) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
