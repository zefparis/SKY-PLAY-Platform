import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @Min(100)
  amount: number;

  @IsOptional()
  @IsString()
  provider?: string;
}

export class WithdrawDto {
  @IsNumber()
  @Min(1000)
  amount: number;

  @IsString()
  accountNumber: string;

  @IsString()
  bankCode: string;
}
