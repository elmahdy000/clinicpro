import { IsNotEmpty, IsString } from 'class-validator';

export class PatientLoginDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
