import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClinicsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const clinics = await this.prisma.clinic.findMany({
      include: {
        _count: {
          select: {
            users: true,
            doctors: true,
            clinicPatients: true,
            appointments: true,
            invoices: true,
            prescriptions: true,
          },
        },
        settings: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return clinics.map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      phone: c.phone,
      subscriptionPlan: c.subscriptionPlan,
      subscriptionStatus: c.subscriptionStatus,
      currency: c.settings?.currency ?? 'EGP',
      stats: {
        users: c._count.users,
        doctors: c._count.doctors,
        patients: c._count.clinicPatients,
        appointments: c._count.appointments,
        invoices: c._count.invoices,
        prescriptions: c._count.prescriptions,
      },
      createdAt: c.createdAt,
    }));
  }

  async findOne(id: number) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
      include: {
        settings: true,
        _count: {
          select: {
            users: true,
            doctors: true,
            clinicPatients: true,
            appointments: true,
            invoices: true,
            prescriptions: true,
            medicalRecords: true,
            fileUploads: true,
          },
        },
      },
    });

    if (!clinic) throw new NotFoundException(`Clinic #${id} not found`);

    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    // Run detailed queries in parallel
    const [
      todayAppointments,
      monthAppointments,
      revenueAgg,
      monthRevenue,
      pendingInvoices,
      doctors,
      recentPatients,
      appointmentsByStatus,
      todaySchedule,
      topMedicationsRaw,
    ] = await Promise.all([
      this.prisma.appointment.count({ where: { clinicId: id, appointmentDate: { gte: startOfToday, lte: endOfToday } } }),
      this.prisma.appointment.count({ where: { clinicId: id, appointmentDate: { gte: startOfMonth } } }),
      this.prisma.invoice.aggregate({ _sum: { total: true }, where: { clinicId: id, status: 'PAID' } }),
      this.prisma.invoice.aggregate({ _sum: { total: true }, where: { clinicId: id, status: 'PAID', createdAt: { gte: startOfMonth } } }),
      this.prisma.invoice.aggregate({ _sum: { total: true }, _count: { id: true }, where: { clinicId: id, status: 'PENDING' } }),
      this.prisma.doctor.findMany({
        where: { clinicId: id },
        select: {
          id: true, specialization: true, consultationFee: true, status: true,
          user: { select: { name: true, email: true } },
          _count: { select: { appointments: true, prescriptions: true } },
        },
      }),
      this.prisma.clinicPatient.findMany({
        where: { clinicId: id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { patient: { select: { id: true, firstName: true, lastName: true, phone: true, createdAt: true } } },
      }),
      this.prisma.appointment.groupBy({
        by: ['status'],
        where: { clinicId: id },
        _count: { id: true },
      }),
      this.prisma.appointment.findMany({
        where: { clinicId: id, appointmentDate: { gte: startOfToday, lte: endOfToday } },
        take: 8,
        orderBy: { appointmentDate: 'asc' },
        include: {
          patient: { select: { firstName: true, lastName: true, phone: true } },
          doctor: { select: { specialization: true, user: { select: { name: true } } } },
        },
      }),
      this.prisma.prescriptionItem.groupBy({
        by: ['medicationId'],
        where: { prescription: { clinicId: id } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    // Resolve medication names
    let topMedications: any[] = [];
    if (topMedicationsRaw.length > 0) {
      const medIds = topMedicationsRaw.map((m) => m.medicationId);
      const meds = await this.prisma.medication.findMany({ where: { id: { in: medIds } } });
      const medMap = new Map(meds.map((m) => [m.id, m]));
      topMedications = topMedicationsRaw.map((m) => ({
        id: m.medicationId,
        name: medMap.get(m.medicationId)?.name || 'Unknown',
        category: (medMap.get(m.medicationId) as any)?.category || '',
        count: m._count.id,
      }));
    }

    const statusMap = appointmentsByStatus.reduce((acc: any, curr: any) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {});

    return {
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      subscriptionPlan: clinic.subscriptionPlan,
      subscriptionStatus: clinic.subscriptionStatus,
      currency: clinic.settings?.currency ?? 'EGP',
      timezone: clinic.settings?.timezone ?? 'Africa/Cairo',
      createdAt: clinic.createdAt,
      counts: {
        users: clinic._count.users,
        doctors: clinic._count.doctors,
        patients: clinic._count.clinicPatients,
        appointments: clinic._count.appointments,
        invoices: clinic._count.invoices,
        prescriptions: clinic._count.prescriptions,
        medicalRecords: clinic._count.medicalRecords,
        files: clinic._count.fileUploads,
      },
      today: {
        appointments: todayAppointments,
        schedule: todaySchedule,
      },
      month: {
        appointments: monthAppointments,
        revenue: monthRevenue._sum.total ?? 0,
      },
      revenue: {
        total: revenueAgg._sum.total ?? 0,
        pending: { count: pendingInvoices._count.id, amount: pendingInvoices._sum.total ?? 0 },
      },
      appointmentsByStatus: statusMap,
      doctors,
      recentPatients: recentPatients.map((cp) => cp.patient),
      topMedications,
    };
  }

  async create(data: any) {
    if (data.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new ConflictException('Email already in use');
    }

    const clinic = await this.prisma.clinic.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        subscriptionPlan: data.subscriptionPlan || 'FREE',
        subscriptionStatus: data.subscriptionStatus || 'ACTIVE',
        settings: {
          create: {
            currency: 'EGP',
            timezone: 'Africa/Cairo',
          },
        },
      },
    });

    if (data.email) {
      const hashedPassword = await bcrypt.hash(data.password || '123456', 10);
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.ownerName || data.name,
          password: hashedPassword,
          role: 'CLINIC_ADMIN',
          clinicId: clinic.id,
        },
      });

      await this.prisma.doctor.create({
        data: {
          userId: user.id,
          clinicId: clinic.id,
          specialization: data.specialization || 'General Medicine',
          consultationFee: 200,
          status: 'ACTIVE',
        },
      });
    }

    return clinic;
  }

  async update(id: number, data: any) {
    return this.prisma.clinic.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        subscriptionPlan: data.subscriptionPlan,
        subscriptionStatus: data.subscriptionStatus,
      },
    });
  }

  async delete(id: number) {
    // Delete settings first
    await this.prisma.clinicSettings.deleteMany({
      where: { clinicId: id }
    });
    // Delete other related records if necessary, or let cascade happen if defined.
    // In this app, SQLite has simple relation cascades or we can delete dependencies
    await this.prisma.clinicPatient.deleteMany({ where: { clinicId: id } });
    
    return this.prisma.clinic.delete({
      where: { id },
    });
  }
}
