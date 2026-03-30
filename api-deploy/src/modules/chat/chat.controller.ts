import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';
import { ChatService } from './chat.service';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import { Logger } from '@nestjs/common';

@Controller('chat')
@UseGuards(JwtDualGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private chatService: ChatService) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error('Missing Cloudinary credentials!');
    } else {
      this.logger.log(`Cloudinary config: cloud_name=${cloudName}`);
    }
    
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  @Get('conversations')
  getConversations(@Request() req: any) {
    return this.chatService.getUserConversations(req.user.id);
  }

  @Post('conversations/dm/:userId')
  openDm(@Request() req: any, @Param('userId') userId: string) {
    return this.chatService.getOrCreateDm(req.user.id, userId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Request() req: any,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(id, req.user.id, cursor, limit ? parseInt(limit) : 50);
  }

  @Post('conversations/:id/read')
  markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.chatService.markAsRead(id, req.user.id);
  }

  @Get('users/search')
  searchUsers(@Request() req: any, @Query('q') q: string) {
    return this.chatService.searchUsers(q ?? '', req.user.id);
  }

  @Post('upload-screenshot')
  @UseInterceptors(FileInterceptor('file'))
  async uploadScreenshot(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    this.logger.log(`Upload started: ${file?.originalname}, size: ${file?.size}, buffer: ${file?.buffer ? 'present' : 'missing'}`);
    
    if (!file || !file.buffer) {
      this.logger.error('No file or buffer provided');
      throw new Error('No file uploaded');
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error('Cloudinary credentials missing');
      throw new Error('Cloudinary not configured');
    }

    try {
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: 'skyplay/screenshots', resource_type: 'image' },
            (err, res) => {
              if (err) {
                this.logger.error(`Cloudinary upload error: ${JSON.stringify(err)}`);
                reject(err);
              } else {
                this.logger.log(`Cloudinary upload success: ${res?.secure_url}`);
                resolve(res!);
              }
            },
          )
          .end(file.buffer);
      });
      return { url: result.secure_url };
    } catch (error: any) {
      this.logger.error(`Upload failed: ${error?.message || JSON.stringify(error)}`);
      throw new Error(`Upload failed: ${error?.message || 'Unknown error'}`);
    }
  }
}
