import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otp: string;
}
