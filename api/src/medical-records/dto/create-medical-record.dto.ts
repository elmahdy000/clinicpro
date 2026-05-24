import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateMedicalRecordDto {
  @IsNumber()
  patientId: number;

  @IsNumber()
  doctorId: number;

  @IsOptional()
  @IsNumber()
  appointmentId?: number;

  @IsString()
  @IsNotEmpty()
  chiefComplaint: string;

  @IsString()
  @IsNotEmpty()
  diagnosis: string;

  @IsString()
  @IsNotEmpty()
  treatmentPlan: string;

  @IsOptional()
  @IsObject()
  vitalSigns?: any;

  @IsOptional()
  @IsString()
  notes?: string;
}
