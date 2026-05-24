import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
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

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.doctorsService.findAll(query);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

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

  @Get(':id/appointments')
  getAppointments(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.getAppointments(id);
  }

  @Get(':id/availability')
  getAvailability(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.getAvailability(id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Put(':id/availability')
  upsertAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAvailabilityDto,
  ) {
    return this.doctorsService.upsertAvailability(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Delete(':id/availability/:dayOfWeek')
  removeAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Param('dayOfWeek', ParseIntPipe) dayOfWeek: number,
  ) {
    return this.doctorsService.removeAvailability(id, dayOfWeek);
  }

  @Get(':id/time-off')
  getTimeOff(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.getTimeOff(id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Post(':id/time-off')
  addTimeOff(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTimeOffDto,
  ) {
    return this.doctorsService.addTimeOff(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Delete('time-off/:timeOffId')
  removeTimeOff(@Param('timeOffId', ParseIntPipe) timeOffId: number) {
    return this.doctorsService.removeTimeOff(timeOffId);
  }

  @Get(':id/available-slots')
  getAvailableSlots(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AvailableSlotsQueryDto,
  ) {
    return this.doctorsService.getAvailableSlots(id, query.date as unknown as string, query.durationMinutes);
  }

  @Get(':id/available-days')
  getAvailableDays(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AvailableDaysQueryDto,
  ) {
    return this.doctorsService.getAvailableDays(id, query.from, query.to, query.durationMinutes);
  }
}
