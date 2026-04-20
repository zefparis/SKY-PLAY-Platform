import { IsString, IsEnum, IsInt, IsOptional, IsNumber, Min } from 'class-validator';

export enum TournamentTypeDto {
  SIMPLE = 'SIMPLE',
  PREMIUM_CLUBS = 'PREMIUM_CLUBS',
  PREMIUM_NATIONS = 'PREMIUM_NATIONS',
  CHAMPIONSHIP = 'CHAMPIONSHIP',
}

export enum TournamentFormatDto {
  POOLS_THEN_KNOCKOUT = 'POOLS_THEN_KNOCKOUT',
  DOUBLE_ROUND_ROBIN = 'DOUBLE_ROUND_ROBIN',
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
}

export class CreateTournamentDto {
  @IsString()
  title: string;

  @IsString()
  game: string;

  @IsEnum(TournamentTypeDto)
  type: TournamentTypeDto;

  @IsEnum(TournamentFormatDto)
  format: TournamentFormatDto;

  @IsInt()
  @Min(100)
  entryFee: number;

  @IsInt()
  @Min(8)
  maxPlayers: number;

  @IsOptional()
  @IsNumber()
  commission?: number;
}

export class JoinTournamentDto {
  @IsOptional()
  @IsString()
  teamName?: string;

  @IsOptional()
  @IsString()
  nation?: string;
}

export class SubmitMatchResultDto {
  @IsInt()
  @Min(0)
  myGoals: number;

  @IsInt()
  @Min(0)
  yellowCards: number;

  @IsInt()
  @Min(0)
  redCards: number;

  @IsOptional()
  @IsString()
  screenshotUrl?: string;
}
