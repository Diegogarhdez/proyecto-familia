import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateIdeaPlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  name: string;
}
