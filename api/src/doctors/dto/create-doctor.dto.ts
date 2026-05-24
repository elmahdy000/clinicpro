import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateDoctorDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  departmentId: number;

  @IsNotEmpty()
  @IsString()
  specialization: string;

  @IsNumber()
  @Min(0)
  consultationFee: number;

  @IsNotEmpty()
  @IsString()
  status: string;
}
