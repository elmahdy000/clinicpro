import { IsOptional, IsString, IsNumber, IsIn, Min, IsDateString, MaxLength } from 'class-validator';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  @IsIn(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'])
  status?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
