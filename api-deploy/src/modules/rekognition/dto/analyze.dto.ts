import { IsString, IsUrl } from 'class-validator';

export class AnalyzeScreenshotDto {
  @IsUrl()
  screenshotUrl: string;

  @IsString()
  game: string;
}
