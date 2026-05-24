import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { UserRole } from '../../users/user-role.enum';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
