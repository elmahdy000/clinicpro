import { IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AppointmentQueryDto extends PaginationDto {
  @IsOptional()
  @IsDateString()
  appointmentDateFrom?: string;

  @IsOptional()
  @IsDateString()
  appointmentDateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  doctorId?: number;
}
