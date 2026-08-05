import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateShoppingDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  quantity?: number;
}
