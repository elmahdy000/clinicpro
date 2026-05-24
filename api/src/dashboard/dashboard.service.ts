import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const CACHE_TTL = 300; // 5 minutes
const CACHE_KEY = 'dashboard:stats';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getStats() {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) return cached;

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    const patientsCount = await this.prisma.patient.count();
    const doctorsCount = await this.prisma.doctor.count();
    const departmentsCount = await this.prisma.department.count();

    const appointmentsByStatus = await this.prisma.appointment.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const invoicesByStatus = await this.prisma.invoice.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { total: true },
    });

    const labTestsByStatus = await this.prisma.labTest.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const revenueAgg = await this.prisma.invoice.aggregate({
      _sum: { total: true },
      where: { status: 'PAID' },
    });

    const result = {
      users: usersByRole.reduce((acc: Record<string, number>, curr) => {
        acc[curr.role] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
      patients: patientsCount,
      doctors: doctorsCount,
      appointments: appointmentsByStatus.reduce((acc: Record<string, number>, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
      departments: departmentsCount,
      revenue: {
        total: revenueAgg._sum.total ?? 0,
        byStatus: invoicesByStatus.reduce((acc: Record<string, { count: number; total: number }>, curr) => {
          acc[curr.status] = { count: curr._count.id, total: curr._sum.total ?? 0 };
          return acc;
        }, {} as Record<string, { count: number; total: number }>),
      },
      labTests: labTestsByStatus.reduce((acc: Record<string, number>, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
    };

    await this.redis.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  }

  async getRecentActivity(limit = 10) {
    return this.prisma.appointment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        doctor: {
          select: {
            id: true,
            specialization: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }
}
