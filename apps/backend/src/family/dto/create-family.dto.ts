import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la familia no puede estar vacío' })
  @MaxLength(100)
  name: string;
}