import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SubmitResultDto {
  @IsNumber()
  score: number;

  @IsOptional()
  @IsString()
  proof?: string;
}
