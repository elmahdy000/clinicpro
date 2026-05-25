import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Get()
  findAll(@Query('q') q?: string) {
    return this.medicationsService.findAll(q);
  }

  @Get('analytics')
  getAnalytics() {
    return this.medicationsService.getAnalytics();
  }

  @Get('table')
  findPaginated(@Query() query: any) {
    return this.medicationsService.findPaginated(query);
  }

  @Post()
  create(@Body() data: any) {
    return this.medicationsService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.medicationsService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicationsService.remove(+id);
  }
}
