import { IsNotEmpty, IsString } from 'class-validator';

export class PatientLoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
