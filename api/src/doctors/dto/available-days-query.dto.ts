import { IsDateString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailableDaysQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  @Max(180)
  durationMinutes?: number;
}
