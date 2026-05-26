import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class AddStockDto {
  @IsInt()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
