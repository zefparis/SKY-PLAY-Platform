import { Module, forwardRef } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { ChallengeInviteService } from './challenge-invite.service';
import { ChallengesController, AdminChallengesController } from './challenges.controller';
import { WalletModule } from '../wallet/wallet.module';
import { ChatModule } from '../chat/chat.module';
import { LeaguesModule } from '../leagues/leagues.module';

@Module({
  imports: [WalletModule, forwardRef(() => ChatModule), LeaguesModule],
  controllers: [ChallengesController, AdminChallengesController],
  providers: [ChallengesService, ChallengeInviteService],
  exports: [ChallengesService, ChallengeInviteService],
})
export class ChallengesModule {}
