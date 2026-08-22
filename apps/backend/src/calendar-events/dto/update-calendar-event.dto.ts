import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateCalendarEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endAt?: Date;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string | null;
}
