import { IsInt, Min, IsOptional, IsString } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
