import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ChallengesService } from '../challenges/challenges.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly challengesService: ChallengesService) {}

  @Cron('*/5 * * * *')
  async processAutoApprovedWinnings() {
    try {
      const result = await this.challengesService.processAutoApprovedWinnings();
      if (result.processed > 0) {
        this.logger.log(`[SCHEDULER] processAutoApprovedWinnings: ${result.processed} gains crédités`);
      }
    } catch (err) {
      this.logger.error('[SCHEDULER] processAutoApprovedWinnings failed', err);
    }
  }

  @Cron('0 * * * *')
  async processExpiredChallenges() {
    try {
      const result = await this.challengesService.processExpiredChallenges();
      if (result.processed > 0) {
        this.logger.log(`[SCHEDULER] processExpiredChallenges: ${result.processed} défis expirés remboursés`);
      }
    } catch (err) {
      this.logger.error('[SCHEDULER] processExpiredChallenges failed', err);
    }
  }
}
