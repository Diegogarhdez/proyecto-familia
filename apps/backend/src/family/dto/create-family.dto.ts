import { IsString, IsNotEmpty } from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la familia no puede estar vacío' })
  name: string;
}