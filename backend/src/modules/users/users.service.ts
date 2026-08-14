import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EncryptionService } from '@/common/encryption/encryption.service';
import { UpdateProfileDto, BlockUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        username: true,
        displayName: true,
        profilePhoto: true,
        bio: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const { displayName, bio, username } = updateProfileDto;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName,
        bio,
        username,
      },
      select: {
        id: true,
        phoneNumber: true,
        username: true,
        displayName: true,
        profilePhoto: true,
        bio: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  /**
   * Upload profile photo
   */
  async uploadProfilePhoto(userId: string, photoPath: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: photoPath },
      select: { id: true, profilePhoto: true },
    });
  }

  /**
   * Block user
   */
  async blockUser(userId: string, blockUserDto: BlockUserDto) {
    const { targetUserId, reason } = blockUserDto;

    if (userId === targetUserId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Check if already blocked
    const existingBlock = await this.prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedUserId: {
          blockerId: userId,
          blockedUserId: targetUserId,
        },
      },
    });

    if (existingBlock) {
      throw new BadRequestException('User is already blocked');
    }

    return this.prisma.blockedUser.create({
      data: {
        blockerId: userId,
        blockedUserId: targetUserId,
        reason,
      },
    });
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string, targetUserId: string) {
    await this.prisma.blockedUser.delete({
      where: {
        blockerId_blockedUserId: {
          blockerId: userId,
          blockedUserId: targetUserId,
        },
      },
    });

    return { message: 'User unblocked successfully' };
  }

  /**
   * Get blocked users list
   */
  async getBlockedUsers(userId: string) {
    return this.prisma.blockedUser.findMany({
      where: { blockerId: userId },
      include: { blockedUser: true },
    });
  }

  /**
   * Search users
   */
  async searchUsers(query: string, limit: number = 20) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { phoneNumber: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        phoneNumber: true,
        username: true,
        displayName: true,
        profilePhoto: true,
        isVerified: true,
      },
      take: limit,
    });
  }

  /**
   * Get contacts
   */
  async getContacts(userId: string) {
    return this.prisma.contact.findMany({
      where: { userId },
      include: { contactUser: true },
    });
  }

  /**
   * Add contact
   */
  async addContact(userId: string, contactUserId: string) {
    if (userId === contactUserId) {
      throw new BadRequestException('You cannot add yourself as a contact');
    }

    const contactUser = await this.prisma.user.findUnique({
      where: { id: contactUserId },
    });

    if (!contactUser) {
      throw new NotFoundException('Contact user not found');
    }

    const existingContact = await this.prisma.contact.findUnique({
      where: {
        userId_contactUserId: {
          userId,
          contactUserId,
        },
      },
    });

    if (existingContact) {
      throw new BadRequestException('Contact already exists');
    }

    return this.prisma.contact.create({
      data: {
        userId,
        contactUserId,
      },
    });
  }

  /**
   * Remove contact
   */
  async removeContact(userId: string, contactUserId: string) {
    await this.prisma.contact.delete({
      where: {
        userId_contactUserId: {
          userId,
          contactUserId,
        },
      },
    });

    return { message: 'Contact removed successfully' };
  }
}
