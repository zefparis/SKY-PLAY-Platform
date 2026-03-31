import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class GetUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fairPlayScore?: number;
}

export class BanUserDto {
  @IsString()
  reason: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration?: number;
}

export class AdjustWalletDto {
  @IsString()
  userId: string;

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsString()
  description: string;

  @IsEnum(['CREDIT', 'DEBIT'])
  type: 'CREDIT' | 'DEBIT';
}

export class ForceResultDto {
  results: Array<{ userId: string; rank: number }>;
}

export class ResolveDisputeDto {
  @IsString()
  winnerId: string;

  @IsOptional()
  @IsString()
  adminNote?: string;
}

export class CancelChallengeDto {
  @IsString()
  reason: string;
}

export class GetStatsQueryDto {
  @IsOptional()
  @IsEnum(['7d', '30d', '90d'])
  period?: '7d' | '30d' | '90d' = '30d';
}

export class GetTransactionsQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AddTestCreditsDto {
  @IsString()
  userId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100000)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class DistributeTestCreditsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10000)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class GetLogsQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
