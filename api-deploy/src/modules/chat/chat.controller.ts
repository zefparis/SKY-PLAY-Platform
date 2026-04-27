import {
  Controller,
  Get,
  Post,
  Delete,
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
import { IceServersService } from './ice-servers.service';
import { JwtDualGuard } from '../auth/guards/jwt-dual.guard';
import { Logger } from '@nestjs/common';

@Controller('chat')
@UseGuards(JwtDualGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private chatService: ChatService,
    private iceServersService: IceServersService,
  ) {
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

  @Get('ice-servers')
  async getIceServers() {
    const iceServers = await this.iceServersService.getIceServers();
    return { iceServers };
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

  @Delete('messages/:messageId')
  deleteMessage(@Request() req: any, @Param('messageId') messageId: string) {
    return this.chatService.deleteMessage(messageId, req.user.id);
  }

  @Post('upload-screenshot')
  @UseInterceptors(FileInterceptor('file'))
  async uploadScreenshot(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    this.logger.log(`Upload request received`);
    
    if (!file) {
      this.logger.error('No file provided in request');
      throw new Error('No file uploaded');
    }

    this.logger.log(`Upload started: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}, buffer: ${file.buffer ? 'present' : 'missing'}`);
    
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      this.logger.error(`File too large: ${file.size} bytes`);
      throw new Error('File size exceeds 5MB limit');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      this.logger.error(`Invalid file type: ${file.mimetype}`);
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    if (!file.buffer) {
      this.logger.error('No file buffer provided');
      throw new Error('No file data received');
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
