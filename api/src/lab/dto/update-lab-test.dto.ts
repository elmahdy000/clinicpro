import { IsOptional, IsString, IsIn, MaxLength } from 'class-validator';

export class UpdateLabTestDto {
  @IsOptional()
  @IsString()
  @IsIn(['ORDERED', 'COLLECTED', 'PROCESSED', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  result?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  referenceRange?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}
