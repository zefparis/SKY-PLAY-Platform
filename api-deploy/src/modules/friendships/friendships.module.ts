import { Module, forwardRef } from '@nestjs/common';
import { FriendshipsController } from './friendships.controller';
import { FriendshipsService } from './friendships.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ChatModule)],
  controllers: [FriendshipsController],
  providers: [FriendshipsService],
  exports: [FriendshipsService],
})
export class FriendshipsModule {}
