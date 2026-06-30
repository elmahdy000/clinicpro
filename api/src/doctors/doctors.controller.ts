import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, UseGuards, Query, Req } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateTimeOffDto } from './dto/create-timeoff.dto';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';
import { AvailableDaysQueryDto } from './dto/available-days-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/user-role.enum';

@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.doctorsService.findAll(query);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

  // --- Doctor self-service (must precede ':id' routes) ---

  @Roles(UserRole.DOCTOR)
  @Get('me')
  getMe(@Req() req: any) {
    return this.doctorsService.getMyProfile(req.user.id);
  }

  @Roles(UserRole.DOCTOR)
  @Get('me/appointments')
  getMyAppointments(@Req() req: any) {
    return this.doctorsService.getMyAppointments(req.user.id);
  }

  @Roles(UserRole.DOCTOR)
  @Get('me/patients')
  getMyPatients(@Req() req: any) {
    return this.doctorsService.getMyPatients(req.user.id);
  }

  @Roles(UserRole.DOCTOR)
  @Get('me/schedule')
  getMySchedule(@Req() req: any) {
    return this.doctorsService.getMySchedule(req.user.id);
  }

  @Roles(UserRole.DOCTOR)
  @Get('me/dashboard')
  getMyDashboard(@Req() req: any) {
    return this.doctorsService.getMyDashboard(req.user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.remove(id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @Get(':id/appointments')
  getAppointments(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.getAppointments(id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @Get(':id/availability')
  getAvailability(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.getAvailability(id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Put(':id/availability')
  upsertAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAvailabilityDto,
    @Req() req: any,
  ) {
    return this.doctorsService.upsertAvailability(id, dto, req.user);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Delete(':id/availability/:dayOfWeek')
  removeAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Param('dayOfWeek', ParseIntPipe) dayOfWeek: number,
    @Req() req: any,
  ) {
    return this.doctorsService.removeAvailability(id, dayOfWeek, req.user);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @Get(':id/time-off')
  getTimeOff(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.getTimeOff(id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Post(':id/time-off')
  addTimeOff(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTimeOffDto,
    @Req() req: any,
  ) {
    return this.doctorsService.addTimeOff(id, dto, req.user);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Delete('time-off/:timeOffId')
  removeTimeOff(@Param('timeOffId', ParseIntPipe) timeOffId: number, @Req() req: any) {
    return this.doctorsService.removeTimeOff(timeOffId, req.user);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @Get(':id/available-slots')
  getAvailableSlots(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AvailableSlotsQueryDto,
  ) {
    return this.doctorsService.getAvailableSlots(id, query.date, query.durationMinutes);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @Get(':id/available-days')
  getAvailableDays(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AvailableDaysQueryDto,
  ) {
    return this.doctorsService.getAvailableDays(id, query.from, query.to, query.durationMinutes);
  }
}
