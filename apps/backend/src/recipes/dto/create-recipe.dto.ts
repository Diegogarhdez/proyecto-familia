import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum RecipeUnit {
  GRAMS = 'GRAMS',
  KILOGRAMS = 'KILOGRAMS',
  MILLILITERS = 'MILLILITERS',
  LITERS = 'LITERS',
  TABLESPOONS = 'TABLESPOONS',
  OUNCES = 'OUNCES',
  UNITS = 'UNITS',
}

export class CreateRecipeIngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsEnum(RecipeUnit)
  unit: RecipeUnit;
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients: CreateRecipeIngredientDto[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  steps: string[];
}
