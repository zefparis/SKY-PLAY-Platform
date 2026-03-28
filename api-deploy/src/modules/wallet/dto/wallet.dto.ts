import { IsEnum, IsInt, IsOptional, IsString, IsEmail, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class InitiateDepositDto {
  @IsInt()
  @Min(500)
  amount: number;

  @IsIn(['MTN', 'ORANGE', 'CARD'])
  paymentMethod: 'MTN' | 'ORANGE' | 'CARD';

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsEmail()
  email: string;

  @IsString()
  name: string;
}

export class VerifyDepositDto {
  @IsString()
  flwTxId: string;

  @IsString()
  transactionId: string;
}

export class InitiateWithdrawalDto {
  @IsInt()
  @Min(1000)
  amount: number;

  @IsString()
  phoneNumber: string;

  @IsIn(['MTN', 'ORANGE'])
  network: 'MTN' | 'ORANGE';

  @IsString()
  name: string;
}

export class GetTransactionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  type?: string;
}
