import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { UsersModule } from '../users/users.module';
import { ChallengesModule } from '../challenges/challenges.module';

@Module({
  imports: [UsersModule, ChallengesModule],
  providers: [ChatGateway],
})
export class ChatModule {}
