import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LinkedAccountsModule } from '../linked-accounts/linked-accounts.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { RtmpService } from './rtmp.service';
import { StreamingController } from './streaming.controller';
import { YoutubeService } from './youtube.service';

@Module({
  imports: [ConfigModule, LinkedAccountsModule, PrismaModule],
  controllers: [StreamingController],
  providers: [YoutubeService, RtmpService],
  exports: [YoutubeService],
})
export class StreamingModule {}
