import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/user-role.enum';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.patientsService.findAll(query);
  }

  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Post()
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PATIENT)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.patientsService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.patientsService.remove(id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @Get(':id/appointments')
  getAppointments(@Param('id', ParseIntPipe) id: number) {
    return this.patientsService.getAppointments(id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @Get(':id/timeline')
  getTimeline(@Param('id', ParseIntPipe) id: number) {
    return this.patientsService.getTimeline(id);
  }
}
