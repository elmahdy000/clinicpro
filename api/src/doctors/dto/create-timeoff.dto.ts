import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateTimeOffDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
