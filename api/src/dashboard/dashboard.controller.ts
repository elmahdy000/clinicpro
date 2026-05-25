import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent-activity')
  getRecentActivity(@Query('limit') limit?: string) {
    return this.dashboardService.getRecentActivity(limit ? parseInt(limit, 10) : 20);
  }

  @Get('recent-prescriptions')
  getRecentPrescriptions() {
    return this.dashboardService.getRecentPrescriptions(5);
  }

  @Get('recent-invoices')
  getRecentInvoices() {
    return this.dashboardService.getRecentInvoices(5);
  }
}
