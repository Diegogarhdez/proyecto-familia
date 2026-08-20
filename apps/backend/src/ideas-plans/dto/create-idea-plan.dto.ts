import { IsNotEmpty, IsString } from 'class-validator';

export class CreateIdeaPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
