import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import { NotificationHelperService } from '../common/services/notification-helper.service';

@Injectable()
export class ClinicsService {
  constructor(
    private prisma: PrismaService,
    private notificationHelper: NotificationHelperService,
  ) {}

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
        governorate: true,
        city: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        invoices: {
          select: {
            total: true,
            status: true,
          },
        },
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          take: 1,
          select: {
            appointmentDate: true,
          },
        },
        doctors: {
          select: {
            specialization: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clinics.map((c) => {
      const owner = c.users.find((u) => u.role === 'DOCTOR' || u.role === 'CLINIC_ADMIN') || c.users[0] || null;
      const revenue = c.invoices.filter((inv) => inv.status === 'PAID').reduce((sum, inv) => sum + inv.total, 0);
      const hasPendingInvoices = c.invoices.some((inv) => inv.status === 'PENDING');
      const pendingInvoicesCount = c.invoices.filter((inv) => inv.status === 'PENDING').length;
      const lastActivity = c.appointments[0]?.appointmentDate ?? c.createdAt;

      return {
        id: c.id,
        name: c.name,
        address: c.address,
        phone: c.phone,
        logoUrl: c.logoUrl,
        subscriptionPlan: c.subscriptionPlan,
        subscriptionStatus: c.subscriptionStatus,
        governorate: (c as any).governorate,
        city: (c as any).city,
        currency: c.settings?.currency ?? 'EGP',
        owner: owner ? { name: owner.name, email: owner.email } : null,
        revenue,
        hasPendingInvoices,
        pendingInvoicesCount,
        lastActivity,
        specializations: c.doctors.map((d) => d.specialization),
        stats: {
          users: c._count.users,
          doctors: c._count.doctors,
          patients: c._count.clinicPatients,
          appointments: c._count.appointments,
          invoices: c._count.invoices,
          prescriptions: c._count.prescriptions,
        },
        createdAt: c.createdAt,
      };
    });
  }

  async findOne(id: number) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
      include: {
        settings: true,
        governorate: true,
        city: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
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
      recentInvoices,
      recentAuditLogs,
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
      this.prisma.invoice.findMany({
        where: { clinicId: id },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.auditLog.findMany({
        where: { clinicId: id },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
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

    const owner = clinic.users.find((u) => u.role === 'DOCTOR' || u.role === 'CLINIC_ADMIN') || clinic.users[0] || null;

    return {
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      logoUrl: clinic.logoUrl,
      subscriptionPlan: clinic.subscriptionPlan,
      subscriptionStatus: clinic.subscriptionStatus,
      governorate: (clinic as any).governorate,
      city: (clinic as any).city,
      currency: clinic.settings?.currency ?? 'EGP',
      timezone: clinic.settings?.timezone ?? 'Africa/Cairo',
      createdAt: clinic.createdAt,
      owner,
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
      invoices: recentInvoices,
      auditLogs: recentAuditLogs,
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
          role: 'DOCTOR',
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

  async update(id: number, data: any, user?: any) {
    if (user && user.role !== 'PLATFORM_OWNER' && user.clinicId !== id) {
      throw new ForbiddenException('You can only update your own clinic');
    }
    const current = await this.prisma.clinic.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`Clinic #${id} not found`);

    const updated = await this.prisma.clinic.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        subscriptionPlan: data.subscriptionPlan,
        subscriptionStatus: data.subscriptionStatus,
      },
    });

    if (data.subscriptionPlan && data.subscriptionPlan !== current.subscriptionPlan) {
      const platformOwner = await this.prisma.user.findFirst({
        where: { role: 'PLATFORM_OWNER' },
      });
      if (platformOwner) {
        await this.notificationHelper.sendSubscriptionUpgraded(
          platformOwner.id,
          updated.name,
          updated.subscriptionPlan
        ).catch(() => {});
      }
    }

    return updated;
  }

  async updateLogo(id: number, filename: string, user: any) {
    const clinic = await this.prisma.clinic.findUnique({ where: { id } });
    if (!clinic) throw new NotFoundException(`Clinic #${id} not found`);

    if (user.role !== 'PLATFORM_OWNER' && user.clinicId !== id) {
      throw new ForbiddenException('You can only update your own clinic logo');
    }

    if (clinic.logoUrl) {
      const segments = clinic.logoUrl.split('/');
      const oldFile = segments[segments.length - 1];
      const oldPath = `./uploads/${oldFile}`;
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const logoUrl = `/api/uploads/${filename}`;
    return this.prisma.clinic.update({ where: { id }, data: { logoUrl } });
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
