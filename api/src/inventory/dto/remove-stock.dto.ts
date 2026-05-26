import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class RemoveStockDto {
  @IsInt()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsInt()
  referenceId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
