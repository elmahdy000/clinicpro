import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/user-role.enum';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.prescriptionsService.findAll(query);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Post()
  create(@Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.prescriptionsService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePrescriptionDto) {
    return this.prescriptionsService.update(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Post(':id/medicines/:lineId/substitute')
  substituteMedicine(
    @Param('id', ParseIntPipe) id: number,
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() dto: any
  ) {
    return this.prescriptionsService.substituteMedicine(id, lineId, dto);
  }

  @Get(':id/substitution-logs')
  getSubstitutionLogs(@Param('id', ParseIntPipe) id: number) {
    return this.prescriptionsService.getSubstitutionLogs(id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PLATFORM_OWNER)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prescriptionsService.remove(id);
  }
}
