import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum';

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

  @IsOptional()
  @IsEnum(AppointmentStatus, {
    message: `rescheduleStatus must be one of: ${Object.values(AppointmentStatus).join(', ')}`,
  })
  rescheduleStatus?: AppointmentStatus;
}
