import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { LabService } from './lab.service';
import { CreateLabTestDto } from './dto/create-lab-test.dto';
import { UpdateLabTestDto } from './dto/update-lab-test.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/user-role.enum';

@Controller('lab')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.labService.findAll(query);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @Post()
  create(@Body() dto: CreateLabTestDto) {
    return this.labService.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.labService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLabTestDto) {
    return this.labService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.labService.remove(id);
  }
}
