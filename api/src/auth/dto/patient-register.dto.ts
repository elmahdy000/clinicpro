import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class PatientRegisterDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  patientCode?: string;
}
