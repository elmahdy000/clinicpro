import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';

@Controller('clinics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get()
  @Roles(UserRole.PLATFORM_OWNER)
  findAll() {
    return this.clinicsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.PLATFORM_OWNER)
  findOne(@Param('id') id: string) {
    return this.clinicsService.findOne(+id);
  }

  @Post()
  @Roles(UserRole.PLATFORM_OWNER)
  create(@Body() body: any) {
    return this.clinicsService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.PLATFORM_OWNER)
  update(@Param('id') id: string, @Body() body: any) {
    return this.clinicsService.update(+id, body);
  }

  @Delete(':id')
  @Roles(UserRole.PLATFORM_OWNER)
  delete(@Param('id') id: string) {
    return this.clinicsService.delete(+id);
  }
}
