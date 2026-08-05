import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';

export class UpdateShoppingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;
}
