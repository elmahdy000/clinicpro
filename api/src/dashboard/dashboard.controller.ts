import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PLATFORM_OWNER)
  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.PLATFORM_OWNER)
  @Get('recent-activity')
  getRecentActivity(@Query('limit') limit?: string) {
    return this.dashboardService.getRecentActivity(limit ? parseInt(limit, 10) : 20);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PLATFORM_OWNER)
  @Get('recent-prescriptions')
  getRecentPrescriptions() {
    return this.dashboardService.getRecentPrescriptions(5);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PLATFORM_OWNER)
  @Get('recent-invoices')
  getRecentInvoices() {
    return this.dashboardService.getRecentInvoices(5);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PLATFORM_OWNER)
  @Get('pharma-insights')
  async getPharmaInsights() {
    const analytics = await this.medicationsService.getAnalytics();
    const store = tenantStorage.getStore();
    const diagnosisDrugs = await this.prisma.medicalRecord.findMany({
      where: { diagnosis: { not: '' }, clinicId: store?.clinicId ?? 0 },
      select: { diagnosis: true, id: true },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });
    const diagCorrelations = diagnosisDrugs
      .filter((r) => r.diagnosis)
      .reduce((acc: Record<string, number>, r) => {
        const d = r.diagnosis.split(/[،,]/)[0].trim();
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {});
    const topDiagnoses = Object.entries(diagCorrelations)
      .map(([diagnosis, count]) => ({ diagnosis, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      summary: analytics.summary,
      topMedications: analytics.topMedications,
      categoryShare: analytics.categoryShare,
      formShare: analytics.formShare,
      diagnosisDrugCorrelation: topDiagnoses,
    };
  }
}
