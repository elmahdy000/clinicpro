import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/user-role.enum';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.appointmentsService.findAll(query);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get('today')
  findToday() {
    return this.appointmentsService.findToday();
  }

  @Get('upcoming')
  findUpcoming() {
    return this.appointmentsService.findUpcoming();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @Put(':id/reschedule')
  reschedule(@Param('id', ParseIntPipe) id: number, @Body() dto: RescheduleAppointmentDto) {
    return this.appointmentsService.reschedule(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.remove(id);
  }
}
