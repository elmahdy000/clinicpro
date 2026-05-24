import { IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '../user-role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
