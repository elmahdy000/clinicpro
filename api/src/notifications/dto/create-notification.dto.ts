import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

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
  type?: string;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsInt()
  referenceId?: number;
}
