import { IsNumber, IsString, IsBoolean, IsOptional, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateAvailabilityDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  @MinLength(5)
  @MaxLength(5)
  startTime: string;

  @IsString()
  @MinLength(5)
  @MaxLength(5)
  endTime: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  slotDuration?: number = 30;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean = true;
}
