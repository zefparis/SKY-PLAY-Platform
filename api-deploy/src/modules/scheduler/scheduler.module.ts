import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { ChallengesModule } from '../challenges/challenges.module';

@Module({
  imports: [ChallengesModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
