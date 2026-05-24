import { IsDateString, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsDateString()
  appointmentDate: string;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(180)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
