import { Module } from '@nestjs/common';
import { AdsService } from './ads.service';
import { AdsController, AdminAdsController } from './ads.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdsController, AdminAdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}
