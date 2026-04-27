import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import { RolesGuard } from '../admin/guards/roles.guard';
import { Roles } from '../admin/decorators/roles.decorator';
import { RekognitionService } from './rekognition.service';
import { AnalyzeScreenshotDto } from './dto/analyze.dto';

/**
 * Admin-only endpoint to test/calibrate the Rekognition pipeline.
 * Returns the raw analysis result so admins can tune per-game parsers.
 */
@Controller('rekognition')
@UseGuards(JwtDualGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RekognitionController {
  constructor(private readonly rekognition: RekognitionService) {}

  @Post('analyze')
  async analyze(@Body() dto: AnalyzeScreenshotDto) {
    const s3Key = this.rekognition.extractS3Key(dto.screenshotUrl);
    const result = await this.rekognition.analyzeScreenshot(s3Key, dto.game);
    return {
      s3Key,
      bucket: 'inferred-from-config',
      game: dto.game,
      ...result,
    };
  }
}
