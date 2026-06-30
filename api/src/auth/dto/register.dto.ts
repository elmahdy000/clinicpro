import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { UserRole } from '../../users/user-role.enum';

// Roles allowed for self-registration (public endpoint)
const SELF_REGISTER_ROLES = [UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST] as const;
type SelfRegisterRole = (typeof SELF_REGISTER_ROLES)[number];

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(SELF_REGISTER_ROLES, {
    message: `role must be one of: ${SELF_REGISTER_ROLES.join(', ')}`,
  })
  role: SelfRegisterRole;
}
