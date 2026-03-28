import { Module } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { ChallengesController, AdminChallengesController } from './challenges.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [ChallengesController, AdminChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
