import { Module } from '@nestjs/common';
import { RekognitionService } from './rekognition.service';
import { RekognitionController } from './rekognition.controller';

@Module({
  controllers: [RekognitionController],
  providers: [RekognitionService],
  exports: [RekognitionService],
})
export class RekognitionModule {}
