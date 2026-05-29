import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetInventoryQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  medicationId?: string;

  @IsOptional()
  @IsString()
  lowStock?: string;
}
