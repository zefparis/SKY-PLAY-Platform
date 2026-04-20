import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import { UploadService } from './upload.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png'];

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(JwtDualGuard)
  @Post('screenshot')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
          cb(new BadRequestException('Format non supporté. Utilisez JPEG ou PNG.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadScreenshot(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException('Fichier trop volumineux (max 5 Mo)');

    const url = await this.uploadService.uploadFile(file.buffer, file.mimetype, 'screenshots');
    return { url };
  }
}
