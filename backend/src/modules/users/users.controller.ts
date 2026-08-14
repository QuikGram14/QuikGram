import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Request,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto, BlockUserDto, AddContactDto } from './dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Get('search')
  async searchUsers(@Query('q') query: string) {
    return this.usersService.searchUsers(query);
  }

  @Get('contacts')
  async getContacts(@Request() req) {
    return this.usersService.getContacts(req.user.id);
  }

  @Post('contacts')
  @HttpCode(HttpStatus.CREATED)
  async addContact(@Request() req, @Body() addContactDto: AddContactDto) {
    return this.usersService.addContact(req.user.id, addContactDto.contactUserId);
  }

  @Delete('contacts/:contactUserId')
  @HttpCode(HttpStatus.OK)
  async removeContact(@Request() req, @Param('contactUserId') contactUserId: string) {
    return this.usersService.removeContact(req.user.id, contactUserId);
  }

  @Post('block')
  @HttpCode(HttpStatus.CREATED)
  async blockUser(@Request() req, @Body() blockUserDto: BlockUserDto) {
    return this.usersService.blockUser(req.user.id, blockUserDto);
  }

  @Delete('block/:targetUserId')
  @HttpCode(HttpStatus.OK)
  async unblockUser(@Request() req, @Param('targetUserId') targetUserId: string) {
    return this.usersService.unblockUser(req.user.id, targetUserId);
  }

  @Get('blocked')
  async getBlockedUsers(@Request() req) {
    return this.usersService.getBlockedUsers(req.user.id);
  }
}
