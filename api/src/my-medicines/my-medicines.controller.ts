import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { MyMedicinesService } from './my-medicines.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('my-medicines')
export class MyMedicinesController {
  constructor(private readonly service: MyMedicinesService) {}

  @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN)
  @Get()
  findAll(@Req() req: any, @Query() query: any) {
    return this.service.findAll(req.user.id, req.user.clinicId, req.user.role, query);
  }

  @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN)
  @Post()
  create(@Req() req: any, @Body() data: any) {
    return this.service.create(req.user.id, req.user.clinicId, req.user.role, data);
  }

  @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN)
  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.update(req.user.id, req.user.clinicId, req.user.role, +id, data);
  }

  @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN)
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.id, req.user.clinicId, req.user.role, +id);
  }

  @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN)
  @Put(':id/favorite')
  toggleFavorite(@Req() req: any, @Param('id') id: string) {
    return this.service.toggleFavorite(req.user.id, req.user.clinicId, req.user.role, +id);
  }

  @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN)
  @Get('search')
  search(@Req() req: any, @Query('q') q?: string) {
    return this.service.search(req.user.id, req.user.clinicId, req.user.role, q || '');
  }

  @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN)
  @Post('import')
  importFromGlobal(@Req() req: any, @Body() body: { medicineId: number }) {
    return this.service.importFromGlobal(req.user.id, req.user.clinicId, req.user.role, body.medicineId);
  }
}
