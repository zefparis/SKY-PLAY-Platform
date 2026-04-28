import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum DisputeResolution {
  PLAYER1_WINS = 'PLAYER1_WINS',
  PLAYER2_WINS = 'PLAYER2_WINS',
  REFUND_BOTH = 'REFUND_BOTH',
  CANCEL = 'CANCEL',
}

export class ResolveDisputeDto {
  @IsEnum(DisputeResolution)
  resolution!: DisputeResolution;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;
}
