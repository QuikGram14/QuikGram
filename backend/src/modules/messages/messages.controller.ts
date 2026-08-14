import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('chat/:chatId')
  async getChatMessages(
    @Param('chatId') chatId: string,
    @Request() req,
    @Query('page') page: number = 1,
  ) {
    return this.messagesService.getChatMessages(chatId, req.user.id, page);
  }

  @Put(':messageId')
  async editMessage(@Param('messageId') messageId: string, @Request() req, @Body() body: any) {
    return this.messagesService.editMessage(messageId, req.user.id, body.content);
  }

  @Delete(':messageId')
  async deleteMessage(@Param('messageId') messageId: string, @Request() req) {
    return this.messagesService.deleteMessage(messageId, req.user.id);
  }

  @Post(':messageId/react')
  async addReaction(@Param('messageId') messageId: string, @Request() req, @Body() body: any) {
    return this.messagesService.addReaction(messageId, req.user.id, body.emoji);
  }

  @Delete(':messageId/react/:emoji')
  async removeReaction(
    @Param('messageId') messageId: string,
    @Request() req,
  ) {
    return this.messagesService.removeReaction(messageId, req.user.id);
  }
}
