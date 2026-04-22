import { IsString, IsOptional, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Le pseudo ne peut pas être vide' })
  @MinLength(3, { message: 'Le pseudo doit faire au moins 3 caractères' })
  @MaxLength(20, { message: 'Le pseudo ne peut pas dépasser 20 caractères' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, { message: 'Le pseudo ne peut contenir que des lettres, chiffres, _, . ou -' })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  discordTag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  twitchUsername?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-().]{7,20}$/, { message: 'Numéro de téléphone invalide (format international requis)' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  nationality?: string;
}
