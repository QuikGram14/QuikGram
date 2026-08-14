import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { EncryptionModule } from '@/common/encryption/encryption.module';

@Module({
  imports: [PrismaModule, EncryptionModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
