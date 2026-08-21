import { IsEmail } from 'class-validator';

export class VerificationEmailDto {
  @IsEmail()
  email: string;
}