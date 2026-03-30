import { Module, forwardRef } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { ChallengesController, AdminChallengesController } from './challenges.controller';
import { WalletModule } from '../wallet/wallet.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [WalletModule, forwardRef(() => ChatModule)],
  controllers: [ChallengesController, AdminChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
