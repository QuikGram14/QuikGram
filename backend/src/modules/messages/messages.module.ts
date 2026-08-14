import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { EncryptionModule } from '@/common/encryption/encryption.module';

@Module({
  imports: [PrismaModule, EncryptionModule],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
