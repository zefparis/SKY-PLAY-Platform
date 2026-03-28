import { IsNotEmpty } from 'class-validator';

export class UploadAvatarDto {
  @IsNotEmpty()
  file: Express.Multer.File;
}
