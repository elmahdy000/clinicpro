import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMedicationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  activeIngredient?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  strength?: string;

  @IsOptional()
  @IsString()
  form?: string;

  @IsOptional()
  @IsString()
  route?: string;

  @IsOptional()
  @IsString()
  therapeuticClass?: string;

  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;

  @IsOptional()
  @IsNumber()
  clinicId?: number;
}
