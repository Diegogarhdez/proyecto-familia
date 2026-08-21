import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export class MonthDto {
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month: string;
}

export class UpsertIncomeDto extends MonthDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateExpenseCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyLimit: number;
}

export class CreateExpenseDto extends MonthDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
