import { IsEmail, IsString, MinLength } from 'class-validator';

export class JoinDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  inviteCode: string; // 👈 El código secreto que le pasará el Admin
}