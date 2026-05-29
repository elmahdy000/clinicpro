import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER)
  @Get()
  findAll(@Query('q') q?: string) {
    return this.medicationsService.findAll(q);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PLATFORM_OWNER)
  @Get('analytics')
  getAnalytics() {
    return this.medicationsService.getAnalytics();
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER)
  @Get('table')
  findPaginated(@Query() query: any) {
    return this.medicationsService.findPaginated(query);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PLATFORM_OWNER)
  @Post()
  create(@Body() data: any) {
    return this.medicationsService.create(data);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PLATFORM_OWNER)
  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.medicationsService.update(+id, data);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PLATFORM_OWNER)
  @Get(':id/alternatives')
  findAlternatives(
    @Param('id') id: string,
    @Query('patientId') patientId?: string,
    @Query('includeCheaper') includeCheaper?: string
  ) {
    return this.medicationsService.findAlternatives(+id, patientId ? +patientId : undefined, includeCheaper === 'true');
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PLATFORM_OWNER)
  @Get('market/shortages')
  getMarketShortages() {
    return this.medicationsService.getMarketShortages();
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PLATFORM_OWNER)
  @Get('market/top-substitutions')
  getTopSubstitutions(@Query('limit') limit?: string) {
    return this.medicationsService.getTopSubstitutionPairs(limit ? +limit : 20);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER)
  @Get('search')
  search(@Query('q') q?: string) {
    return this.medicationsService.findAll(q);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER)
  @Get('active-ingredients')
  getActiveIngredients(@Query('q') q?: string) {
    return this.medicationsService.getActiveIngredients(q);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER)
  @Get('manufacturers')
  getManufacturers(@Query('q') q?: string) {
    return this.medicationsService.getManufacturers(q);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PLATFORM_OWNER)
  @Put(':id/shortage')
  updateShortage(@Param('id') id: string, @Body() body: { isMarketShortage: boolean; shortageNote?: string }) {
    return this.medicationsService.updateShortageStatus(+id, body.isMarketShortage, body.shortageNote);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PLATFORM_OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicationsService.remove(+id);
  }
}
