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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
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
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'skyplay/screenshots', resource_type: 'image' },
          (err, res) => (err ? reject(err) : resolve(res!)),
        )
        .end(file.buffer);
    });
    return { url: result.secure_url };
  }
}
