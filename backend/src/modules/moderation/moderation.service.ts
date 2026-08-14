import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async reportMessage(messageId: string, userId: string, reason: string) {
    return this.prisma.spamReport.create({
      data: {
        messageId,
        reporterId: userId,
        reason,
      },
    });
  }

  async reportUser(userId: string, targetUserId: string, reason: string) {
    return this.prisma.spamReport.create({
      data: {
        userId: targetUserId,
        reporterId: userId,
        reason,
      },
    });
  }

  async getReports(limit: number = 20) {
    return this.prisma.spamReport.findMany({
      where: { status: 'PENDING' },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveReport(reportId: string, moderatorId: string, action: string) {
    return this.prisma.spamReport.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        reviewedBy: moderatorId,
        reviewedAt: new Date(),
      },
    });
  }

  async blockUser(userId: string, moderatorId: string, reason: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    });
  }
}
