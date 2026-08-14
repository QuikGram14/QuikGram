import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('stats/users')
  async getUserStats() {
    return this.adminService.getUserStats();
  }

  @Get('stats/chats')
  async getChatsStats() {
    return this.adminService.getChatsStats();
  }

  @Get('logs/moderation')
  async getModerationLogs() {
    return this.adminService.getModerationLogs();
  }

  @Get('logs/audit')
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}
