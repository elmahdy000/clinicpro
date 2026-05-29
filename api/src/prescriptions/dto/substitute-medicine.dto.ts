import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SubstituteMedicineDto {
  @IsNumber()
  alternativeMedicineId: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  doctorNotes?: string;

  @IsOptional()
  safetyWarningsShown?: any[];
}
