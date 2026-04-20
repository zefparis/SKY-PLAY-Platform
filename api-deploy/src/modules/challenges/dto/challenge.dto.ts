import { IsString, IsEnum, IsOptional, IsInt, IsNumber, IsBoolean } from 'class-validator';
import { ChallengeType } from '@prisma/client';

export class CreateChallengeDto {
  @IsString()
  title: string;

  @IsString()
  game: string;

  @IsEnum(ChallengeType)
  type: ChallengeType;
}

export class JoinChallengeDto {}

export class SubmitResultDto {
  @IsInt()
  rank: number;

  @IsOptional()
  @IsString()
  screenshotUrl?: string;
}

export class ForceDisputeDto {
  @IsString()
  reason: string;
}

export class ResolveDisputeDto {
  @IsString()
  winnerId: string;

  @IsString()
  adminNote: string;
}

export class FindAllChallengesDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  game?: string;

  @IsOptional()
  @IsEnum(ChallengeType)
  type?: ChallengeType;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class CreateInviteDto {
  @IsString()
  toUserId: string;
}

export class RespondInviteDto {
  @IsBoolean()
  accept: boolean;
}
