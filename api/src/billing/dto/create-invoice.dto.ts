import { IsNumber, IsOptional, IsString, IsArray, ValidateNested, Min, IsDateString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceItemDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @IsNumber()
  patientId: number;

  @IsOptional()
  @IsNumber()
  doctorId?: number;

  @IsOptional()
  @IsNumber()
  appointmentId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
