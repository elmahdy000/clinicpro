import { IsDateString, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreatePrescriptionDto {
  @IsNumber()
  patientId: number;

  @IsNumber()
  doctorId: number;

  @IsOptional()
  @IsNumber()
  medicalRecordId?: number;

  @IsNotEmpty()
  medications: any;

  @IsOptional()
  substitutions?: any[];

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsDateString()
  prescribedDate?: Date;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  branchName?: string;
}
