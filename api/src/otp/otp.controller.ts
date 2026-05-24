import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto.email);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto.email, dto.otp);
  }
}
