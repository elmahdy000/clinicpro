import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { MedicationsService } from '../medications/medications.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';
import { tenantStorage } from '../prisma/tenant-context';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly medicationsService: MedicationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER)
  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.PLATFORM_OWNER)
  @Get('recent-activity')
  getRecentActivity(@Query('limit') limit?: string) {
    return this.dashboardService.getRecentActivity(limit ? parseInt(limit, 10) : 20);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER)
  @Get('recent-prescriptions')
  getRecentPrescriptions() {
    return this.dashboardService.getRecentPrescriptions(5);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER)
  @Get('recent-invoices')
  getRecentInvoices() {
    return this.dashboardService.getRecentInvoices(5);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PLATFORM_OWNER)
  @Get('pharma-insights')
  async getPharmaInsights(
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
    @Query('specialty') specialty?: string,
    @Query('medication') medication?: string,
    @Query('period') period?: string,
  ) {
    const analytics = await this.medicationsService.getAnalytics(governorateId, cityId, specialty, medication, period);
    const store = tenantStorage.getStore();
    const isOwner = !store?.clinicId;
    const diagnosisDrugs = await this.prisma.medicalRecord.findMany({
      where: { diagnosis: { not: '' }, ...(isOwner ? {} : { clinicId: store?.clinicId as number }) },
      select: { diagnosis: true, id: true },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });
    const diagCorrelations = diagnosisDrugs
      .filter((r: { diagnosis: string }) => r.diagnosis)
      .reduce((acc: Record<string, number>, r: { diagnosis: string }) => {
        const d = r.diagnosis.split(/[،,]/)[0].trim();
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    const topDiagnoses = Object.entries(diagCorrelations)
      .map(([diagnosis, count]: [string, number]) => ({ diagnosis, count }))
      .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
      .slice(0, 5);

    return {
      summary: analytics.summary,
      topMedications: analytics.topMedications,
      categoryShare: analytics.categoryShare,
      formShare: analytics.formShare,
      specialtyShare: analytics.specialtyShare,
      diagnosisDrugCorrelation: topDiagnoses,
    };
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER)
  @Get('top-medicines')
  async getTopMedicines(@Query('period') period?: string) {
    return this.dashboardService.getTopMedicines(period || 'month');
  }

  @Roles(UserRole.PLATFORM_OWNER)
  @Get('subscription-invoices')
  getSubscriptionInvoices() {
    return this.dashboardService.getSubscriptionInvoices();
  }

  @Roles(UserRole.PLATFORM_OWNER)
  @Post('subscription-invoices')
  createSubscriptionInvoice(@Body() data: any) {
    return this.dashboardService.createSubscriptionInvoice(data);
  }

  @Roles(UserRole.PLATFORM_OWNER)
  @Patch('subscription-invoices/:id/status')
  updateSubscriptionInvoiceStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.dashboardService.updateSubscriptionInvoiceStatus(+id, status);
  }

  @Roles(UserRole.PLATFORM_OWNER)
  @Delete('subscription-invoices/:id')
  deleteSubscriptionInvoice(@Param('id') id: string) {
    return this.dashboardService.deleteSubscriptionInvoice(+id);
  }
}
