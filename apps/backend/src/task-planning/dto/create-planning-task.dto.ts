import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreatePlanningTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  name: string;

  @IsInt()
  @Min(1)
  @Max(1440)
  timeMinutes: number;

  @IsInt()
  @Min(1)
  @Max(5)
  effort: number;

  @IsInt()
  @Min(1)
  @Max(7)
  weeklyFrequency: number;

  @IsOptional()
  @IsString()
  preferredUserId?: string | null;
}
