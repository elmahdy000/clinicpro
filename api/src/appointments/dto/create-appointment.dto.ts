import { IsDateString, IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum';

export class CreateAppointmentDto {
  @IsNumber()
  patientId: number;

  @IsNumber()
  doctorId: number;

  @IsDateString()
  appointmentDate: string;

  @IsNumber()
  @Min(5)
  @Max(180)
  durationMinutes: number;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  branchName?: string;
}
