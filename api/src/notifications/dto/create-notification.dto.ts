import { IsString, IsNotEmpty, IsOptional, IsInt, IsIn } from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  @IsIn(['INFO', 'WARNING', 'ERROR', 'SUCCESS'])
  type?: string;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsInt()
  referenceId?: number;
}
