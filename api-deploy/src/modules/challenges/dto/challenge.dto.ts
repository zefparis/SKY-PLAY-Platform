import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateChallengeDto {
  @IsString()
  title: string;

  @IsString()
  game: string;

  @IsString()
  gameMode: string;

  @IsString()
  platform: string;

  @IsNumber()
  @Min(0)
  entryFee: number;

  @IsNumber()
  @Min(0)
  prizePool: number;

  @IsNumber()
  @Min(2)
  maxPlayers: number;

  @IsOptional()
  @IsString()
  rules?: string;
}

export class JoinChallengeDto {}
