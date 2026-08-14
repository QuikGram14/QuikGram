import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ModerationService } from './moderation.service';

@Controller('moderation')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private moderationService: ModerationService) {}

  @Post('report/message/:messageId')
  async reportMessage(
    @Param('messageId') messageId: string,
    @Request() req,
    @Body() body: any,
  ) {
    return this.moderationService.reportMessage(messageId, req.user.id, body.reason);
  }

  @Post('report/user/:userId')
  async reportUser(@Param('userId') userId: string, @Request() req, @Body() body: any) {
    return this.moderationService.reportUser(req.user.id, userId, body.reason);
  }

  @Get('reports')
  async getReports(@Request() req) {
    return this.moderationService.getReports();
  }
}
