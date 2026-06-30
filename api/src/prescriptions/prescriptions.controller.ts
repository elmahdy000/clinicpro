import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, UseGuards, Query, Req } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { SubstituteMedicineDto } from './dto/substitute-medicine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/user-role.enum';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @Get()
  findAll(@Query() query: PaginationDto, @Query('mine') mine: string, @Req() req: any) {
    const doctorUserId = mine === '1' || mine === 'true' ? req.user?.id : undefined;
    return this.prescriptionsService.findAll(query, doctorUserId);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Post()
  create(@Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
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
    @Body() dto: SubstituteMedicineDto
  ) {
    return this.prescriptionsService.substituteMedicine(id, lineId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
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
