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
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  private s3: S3Client;

  constructor(private chatService: ChatService) {
    this.s3 = new S3Client({ region: process.env.AWS_REGION ?? 'eu-west-1' });
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
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
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
    const ext = file.mimetype.split('/')[1];
    const key = `screenshots/${randomUUID()}.${ext}`;
    const bucket = process.env.AWS_S3_BUCKET ?? 'skyplay-assets-prod';

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read' as any,
      }),
    );

    const url = `https://${bucket}.s3.${process.env.AWS_REGION ?? 'eu-west-1'}.amazonaws.com/${key}`;
    return { url };
  }
}
