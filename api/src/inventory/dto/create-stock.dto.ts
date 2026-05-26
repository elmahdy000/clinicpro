import { IsInt, IsOptional, Min, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateStockDto {
  @IsInt()
  @IsPositive()
  medicationId: number;

  @IsInt()
  @Min(0)
  quantityOnHand: number;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
