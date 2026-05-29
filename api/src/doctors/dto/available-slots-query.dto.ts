import { IsDateString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailableSlotsQueryDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  @Max(180)
  durationMinutes?: number;
}
