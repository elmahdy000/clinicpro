import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { tenantStorage } from '../prisma/tenant-context';

const CACHE_TTL = 300;
const CACHE_KEY = 'dashboard:stats';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getStats() {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? null;
    const cacheKey = `${CACHE_KEY}:${clinicId ?? 'global'}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const clinicWhere: any = clinicId ? { clinicId } : {};
    const patientClinicWhere: any = clinicId ? { clinics: { some: { clinicId } } } : {};

    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);

    const [
      usersByRole,
      patientsCount,
      doctorsCount,
      newPatientsThisMonth,
      newPatientsThisWeek,
      clinicsCount,
      appointmentsByStatus,
      todayAppointmentsByStatus,
      weekAppointmentsCount,
      invoicesByStatus,
      revenueAgg,
      monthRevenueAgg,
      prescriptionsCount,
      prescriptionsThisMonth,
      topMedicationsRaw,
    ] = await Promise.all([
      this.prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
      this.prisma.patient.count({ where: patientClinicWhere }),
      this.prisma.doctor.count({ where: clinicWhere }),
      this.prisma.patient.count({ where: { ...patientClinicWhere, createdAt: { gte: startOfMonth } } }),
      this.prisma.patient.count({ where: { ...patientClinicWhere, createdAt: { gte: startOfWeek } } }),
      this.prisma.clinic.count(),
      this.prisma.appointment.groupBy({ by: ['status'], where: clinicWhere, _count: { id: true } }),
      this.prisma.appointment.groupBy({
        by: ['status'],
        where: { ...clinicWhere, appointmentDate: { gte: startOfToday, lte: endOfToday } },
        _count: { id: true },
      }),
      this.prisma.appointment.count({ where: { ...clinicWhere, appointmentDate: { gte: startOfWeek } } }),
      this.prisma.invoice.groupBy({ by: ['status'], where: clinicWhere, _count: { id: true }, _sum: { total: true } }),
      this.prisma.invoice.aggregate({ _sum: { total: true }, where: { ...clinicWhere, status: 'PAID' } }),
      this.prisma.invoice.aggregate({ _sum: { total: true }, where: { ...clinicWhere, status: 'PAID', createdAt: { gte: startOfMonth } } }),
      this.prisma.prescription.count({ where: clinicWhere }),
      this.prisma.prescription.count({ where: { ...clinicWhere, createdAt: { gte: startOfMonth } } }),
      this.prisma.prescriptionItem.groupBy({
        by: ['medicationId'],
        where: clinicId ? { prescription: { clinicId } } : {},
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    // Resolve medication names
    let topMedications: any[] = [];
    if (topMedicationsRaw.length > 0) {
      const medIds = topMedicationsRaw.map((m) => m.medicationId);
      const meds = await this.prisma.medication.findMany({ where: { id: { in: medIds } } });
      const medMap = new Map<number, any>(meds.map((m) => [m.id, m]));
      topMedications = topMedicationsRaw.map((m) => ({
        id: m.medicationId,
        name: medMap.get(m.medicationId)?.name || 'Unknown',
        category: medMap.get(m.medicationId)?.category || 'Unknown',
        prescribedCount: m._count.id,
      }));
    }

    // Calculate dynamic 7-day weekly trend
    const trendPromises = Array.from({ length: 7 }).map(async (_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - idx));
      d.setHours(0, 0, 0, 0);
      
      const startOfDay = new Date(d);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      const [appointmentsCount, revenueSum] = await Promise.all([
        this.prisma.appointment.count({
          where: {
            ...clinicWhere,
            appointmentDate: { gte: startOfDay, lte: endOfDay }
          }
        }),
        this.prisma.invoice.aggregate({
          _sum: { total: true },
          where: {
            ...clinicWhere,
            status: 'PAID',
            createdAt: { gte: startOfDay, lte: endOfDay }
          }
        })
      ]);

      return {
        date: d.toISOString().split('T')[0],
        dayIdx: d.getDay(),
        appointments: appointmentsCount,
        revenue: Number(revenueSum._sum.total ?? 0),
      };
    });

    const weeklyTrend = await Promise.all(trendPromises);

    const toStatusMap = (rows: { status: string; _count: { id: number } }[]) =>
      rows.reduce((acc: Record<string, number>, curr) => { acc[curr.status] = curr._count.id; return acc; }, {});

    const hasRealActivity = patientsCount > 0
      || appointmentsByStatus.some((a) => a._count.id > 0)
      || prescriptionsCount > 0;

    const result = {
      isNewClinic: !hasRealActivity,
      clinicsCount,
      patients: patientsCount,
      totalPatients: patientsCount,
      newPatients: newPatientsThisMonth,
      newPatientsThisWeek,
      doctors: doctorsCount,
      users: usersByRole.reduce((acc: Record<string, number>, curr: any) => { acc[curr.role] = curr._count.id; return acc; }, {} as Record<string, number>),
      appointments: toStatusMap(appointmentsByStatus as any),
      todayAppointments: toStatusMap(todayAppointmentsByStatus as any),
      weekAppointmentsCount,
      prescriptions: { total: prescriptionsCount, thisMonth: prescriptionsThisMonth },
      departments: 0,
      revenue: {
        total: revenueAgg._sum.total ?? 0,
        thisMonth: monthRevenueAgg._sum.total ?? 0,
        byStatus: invoicesByStatus.reduce(
          (acc: Record<string, { count: number; total: number }>, curr: any) => {
            acc[curr.status] = { count: curr._count.id, total: curr._sum.total ?? 0 };
            return acc;
          },
          {} as Record<string, { count: number; total: number }>,
        ),
      },
      labTests: {},
      pharmaAnalytics: { topMedications },
      weeklyTrend,
    };

    await this.redis.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getRecentActivity(limit = 20) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? null;

    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

    const where: any = { appointmentDate: { gte: startOfToday, lte: endOfToday } };
    if (clinicId) where.clinicId = clinicId;

    return this.prisma.appointment.findMany({
      take: limit,
      where,
      orderBy: { appointmentDate: 'asc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, dateOfBirth: true } },
        doctor: {
          select: {
            id: true,
            specialization: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async getRecentPrescriptions(limit = 5) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? null;
    const where: any = clinicId ? { clinicId } : {};
    return this.prisma.prescription.findMany({
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, user: { select: { name: true } } } },
        items: { include: { medication: { select: { name: true, category: true } } }, take: 3 },
      },
    });
  }

  async getRecentInvoices(limit = 5) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? null;
    const where: any = clinicId ? { clinicId } : {};
    return this.prisma.invoice.findMany({
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, user: { select: { name: true } } } },
      },
    });
  }
}
