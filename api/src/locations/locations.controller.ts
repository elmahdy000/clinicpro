import { Controller, Get, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('governorates')
  getGovernorates() {
    return this.locationsService.getGovernorates();
  }

  @Get('cities')
  getCities(@Query('governorateId') governorateId?: string) {
    return this.locationsService.getCities(governorateId || '');
  }

  @Get('all')
  getAll() {
    return this.locationsService.getAll();
  }
}
