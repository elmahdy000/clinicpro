import { IsNumber, IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateLabTestDto {
  @IsNumber()
  patientId: number;

  @IsNumber()
  doctorId: number;

  @IsOptional()
  @IsNumber()
  appointmentId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  testName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  testType: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
