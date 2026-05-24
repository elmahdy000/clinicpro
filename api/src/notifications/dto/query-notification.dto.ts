import { IsOptional, IsBoolean, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryNotificationDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
