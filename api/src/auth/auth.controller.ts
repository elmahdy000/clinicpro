import { Controller, Post, Get, Put, Body, UseGuards, Req, HttpCode } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterClinicDto } from './dto/register-clinic.dto';
import { LoginDto } from './dto/login.dto';
import { PatientLoginDto } from './dto/patient-login.dto';
import { PatientRegisterDto } from './dto/patient-register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Registration: 5 attempts / 60s — prevent mass account creation
  @Throttle({ auth: { ttl: 60_000, limit: 5 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Clinic registration: 3 attempts / 60s
  @Throttle({ auth: { ttl: 60_000, limit: 3 } })
  @Post('register-clinic')
  registerClinic(@Body() dto: RegisterClinicDto) {
    return this.authService.registerClinic(dto);
  }

  // Login: 5 attempts / 60s — brute-force protection
  @Throttle({ auth: { ttl: 60_000, limit: 5 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Patient login: 5 attempts / 60s
  @Throttle({ auth: { ttl: 60_000, limit: 5 } })
  @Post('patient-login')
  patientLogin(@Body() dto: PatientLoginDto) {
    return this.authService.patientLogin(dto);
  }

  // Patient register: 3 attempts / 60s
  @Throttle({ auth: { ttl: 60_000, limit: 3 } })
  @Post('patient-register')
  patientRegister(@Body() dto: PatientRegisterDto) {
    return this.authService.patientRegister(dto);
  }

  // Authenticated endpoints — skip throttle (already behind JWT)
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Put('me')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout() {
    return { message: 'Logged out successfully' };
  }

  // Refresh token endpoint — uses refresh JWT, returns new access token.
  // Throttled: this is an unauthenticated-by-password surface and should not be brute-forceable.
  @Throttle({ auth: { ttl: 60_000, limit: 10 } })
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(200)
  refresh(@Req() req: any) {
    return this.authService.refresh(req.user.id);
  }
}
