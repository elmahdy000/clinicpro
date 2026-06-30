import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class PatientRegisterDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[\d٠-٩\s+\-().]{7,20}$/, {
    message: 'phone must be a valid phone number (7–20 digits/characters)',
  })
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
