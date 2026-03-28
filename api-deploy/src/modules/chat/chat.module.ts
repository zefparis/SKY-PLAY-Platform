import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { UsersModule } from '../users/users.module';
import { ChallengesModule } from '../challenges/challenges.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [UsersModule, ChallengesModule, WalletModule],
  providers: [ChatGateway],
})
export class ChatModule {}
