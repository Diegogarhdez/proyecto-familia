import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsNotEmpty, MaxLength, Min, Max } from 'class-validator';

export class CreateShoppingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  quantity?: number;
}
