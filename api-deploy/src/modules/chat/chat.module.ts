import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { UsersModule } from '../users/users.module';
import { ChallengesModule } from '../challenges/challenges.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => ChallengesModule),
    WalletModule,
    MulterModule.register({ storage: undefined }),
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
