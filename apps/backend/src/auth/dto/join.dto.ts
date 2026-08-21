import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class JoinDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  inviteCode: string; // 👈 El código secreto que le pasará el Admin
}