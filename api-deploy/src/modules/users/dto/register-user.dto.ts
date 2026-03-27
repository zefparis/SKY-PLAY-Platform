import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  email!: string;

  // Cognito sub est un UUID-like string; on valide simplement une string non vide.
  @IsString()
  @MinLength(1)
  cognitoSub!: string;
}
