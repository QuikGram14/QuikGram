import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ChatsService } from './chats.service';
import { CreateChatDto, UpdateChatDto, AddUserToChatDto } from './dto';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Get()
  async getUserChats(@Request() req) {
    return this.chatsService.getUserChats(req.user.id);
  }

  @Get(':chatId')
  async getChatById(@Param('chatId') chatId: string, @Request() req) {
    return this.chatsService.getChatById(chatId, req.user.id);
  }

  @Post('private/:userId')
  @HttpCode(HttpStatus.CREATED)
  async createPrivateChat(@Param('userId') userId: string, @Request() req) {
    return this.chatsService.createPrivateChat(req.user.id, userId);
  }

  @Post('group')
  @HttpCode(HttpStatus.CREATED)
  async createGroupChat(@Request() req, @Body() createChatDto: CreateChatDto) {
    return this.chatsService.createGroupChat(req.user.id, createChatDto);
  }

  @Put(':chatId')
  async updateChat(
    @Param('chatId') chatId: string,
    @Request() req,
    @Body() updateChatDto: UpdateChatDto,
  ) {
    return this.chatsService.updateChat(chatId, req.user.id, updateChatDto);
  }

  @Post(':chatId/members')
  @HttpCode(HttpStatus.CREATED)
  async addUserToChat(
    @Param('chatId') chatId: string,
    @Request() req,
    @Body() addUserToChatDto: AddUserToChatDto,
  ) {
    return this.chatsService.addUserToChat(chatId, req.user.id, addUserToChatDto);
  }

  @Delete(':chatId/members/:userId')
  async removeUserFromChat(
    @Param('chatId') chatId: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.chatsService.removeUserFromChat(chatId, req.user.id, userId);
  }

  @Post(':chatId/leave')
  @HttpCode(HttpStatus.OK)
  async leaveChat(@Param('chatId') chatId: string, @Request() req) {
    return this.chatsService.leaveChat(chatId, req.user.id);
  }

  @Post(':chatId/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('chatId') chatId: string, @Request() req) {
    return this.chatsService.markAsRead(chatId, req.user.id);
  }
}
