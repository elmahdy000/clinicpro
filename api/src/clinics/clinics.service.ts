import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import { NotificationHelperService } from '../common/services/notification-helper.service';

@Injectable()
export class ClinicsService {
  private readonly logger = new Logger(ClinicsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationHelper: NotificationHelperService,
  ) {}

  async findAll(query?: any) {
    const q = query?.q;
    const governorateId = query?.governorateId;
    const cityId = query?.cityId;
    const plan = query?.plan;
    const subscriptionStatus = query?.subscriptionStatus;
    const specialty = query?.specialty;

    const where: any = {};

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { address: { contains: q } },
        { phone: { contains: q } },
        { users: { some: { name: { contains: q } } } },
        { users: { some: { email: { contains: q } } } },
      ];
    }

    if (governorateId && governorateId !== 'ALL' && governorateId !== 'all') {
      where.governorateId = governorateId;
    }
    if (cityId && cityId !== 'ALL' && cityId !== 'all') {
      where.cityId = cityId;
    }
    if (plan && plan !== 'ALL' && plan !== 'all') {
      where.subscriptionPlan = plan;
    }
    if (subscriptionStatus && subscriptionStatus !== 'ALL' && subscriptionStatus !== 'all') {
      where.subscriptionStatus = subscriptionStatus;
    }
    if (specialty && specialty !== 'ALL' && specialty !== 'all') {
      where.doctors = {
        some: {
          specialization: { contains: specialty },
        },
      };
    }

    const clinics = await this.prisma.clinic.findMany({
      where,
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
        subscriptionInvoices: {
          orderBy: { dueDate: 'desc' },
          take: 1,
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

      let billingStatus = 'PENDING';
      let derivedSubscriptionStatus = c.subscriptionStatus;
      let trialEndsAt: Date | null = null;
      
      const cAny = c as any;
      if (c.subscriptionPlan === 'FREE') {
        billingStatus = 'PAID';
      } else if (cAny.subscriptionInvoices && cAny.subscriptionInvoices.length > 0) {
        const latestInvoice = cAny.subscriptionInvoices[0];
        if (latestInvoice.status === 'PAID') billingStatus = 'PAID';
        else if (latestInvoice.status === 'PENDING') {
          if (new Date(latestInvoice.dueDate) < new Date()) {
            billingStatus = 'OVERDUE';
          } else {
            billingStatus = 'PENDING';
          }
        } else {
          billingStatus = latestInvoice.status;
        }
      } else {
        if (c.subscriptionStatus === 'ACTIVE') billingStatus = 'PAID';
        else if (c.subscriptionStatus === 'TRIAL') {
          trialEndsAt = new Date(c.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
          if (trialEndsAt < new Date()) {
            billingStatus = 'OVERDUE';
            derivedSubscriptionStatus = 'SUSPENDED'; // Dynamically suspend expired trials
          } else {
            billingStatus = 'PENDING';
          }
        }
        else if (c.subscriptionStatus === 'SUSPENDED') billingStatus = 'OVERDUE';
      }

      return {
        id: c.id,
        name: c.name,
        address: c.address,
        phone: c.phone,
        logoUrl: c.logoUrl,
        subscriptionPlan: c.subscriptionPlan,
        subscriptionStatus: derivedSubscriptionStatus,
        billingStatus,
        trialEndsAt,
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
        name: (medMap.get(m.medicationId) as any)?.name || 'Unknown',
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

    return this.prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          subscriptionPlan: data.subscriptionPlan || 'FREE',
          subscriptionStatus: data.subscriptionStatus || 'ACTIVE',
          governorateId: data.governorateId || undefined,
          cityId: data.cityId || undefined,
          settings: {
            create: {
              currency: 'EGP',
              timezone: 'Africa/Cairo',
              workingDays: '["Sat","Sun","Mon","Tue","Wed","Thu"]',
              branches: '[]'
            },
          },
        },
      });

      if (data.email) {
        const hashedPassword = await bcrypt.hash(data.password || '123456', 10);
        const user = await tx.user.create({
          data: {
            email: data.email,
            name: data.ownerName || data.name,
            password: hashedPassword,
            role: 'DOCTOR',
            clinicId: clinic.id,
          },
        });

        await tx.doctor.create({
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
    });
  }

  async update(id: number, data: any, user?: any) {
    if (user && user.role !== 'PLATFORM_OWNER' && user.clinicId !== id) {
      throw new ForbiddenException('You can only update your own clinic');
    }
    const current = await this.prisma.clinic.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`Clinic #${id} not found`);

    const updateData: any = {
      name: data.name,
      address: data.address,
      phone: data.phone,
      governorateId: data.governorateId !== undefined ? data.governorateId : undefined,
      cityId: data.cityId !== undefined ? data.cityId : undefined,
    };

    // Strict role check: Only the Platform Owner can modify critical subscription fields
    if (user && user.role === 'PLATFORM_OWNER') {
      if (data.subscriptionPlan !== undefined) {
        updateData.subscriptionPlan = data.subscriptionPlan;
      }
      if (data.subscriptionStatus !== undefined) {
        updateData.subscriptionStatus = data.subscriptionStatus;
      }
    }

    const updated = await this.prisma.clinic.update({
      where: { id },
      data: updateData,
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
        ).catch((e) => this.logger.warn(`Subscription upgrade notification failed: ${(e as Error).message}`));
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
    return this.prisma.$transaction(async (tx) => {
      await tx.appointmentStatusChange.deleteMany({ where: { appointment: { clinicId: id } } });
      await tx.stockMovement.deleteMany({ where: { medicationStock: { clinicId: id } } });
      await tx.prescriptionItem.deleteMany({ where: { prescription: { clinicId: id } } });
      await tx.doctorTimeOff.deleteMany({ where: { doctor: { clinicId: id } } });
      await tx.doctorAvailability.deleteMany({ where: { doctor: { clinicId: id } } });
      await tx.medicalRecord.deleteMany({ where: { clinicId: id } });
      await tx.prescription.deleteMany({ where: { clinicId: id } });
      await tx.invoice.deleteMany({ where: { clinicId: id } });
      await tx.appointment.deleteMany({ where: { clinicId: id } });
      await tx.doctor.deleteMany({ where: { clinicId: id } });
      await tx.fileUpload.deleteMany({ where: { clinicId: id } });
      await tx.auditLog.deleteMany({ where: { clinicId: id } });
      await tx.notification.deleteMany({ where: { user: { clinicId: id } } });
      await tx.user.deleteMany({ where: { clinicId: id } });
      await tx.medicationStock.deleteMany({ where: { clinicId: id } });
      await tx.clinicPatient.deleteMany({ where: { clinicId: id } });
      await tx.clinicSettings.deleteMany({ where: { clinicId: id } });

      return tx.clinic.delete({ where: { id } });
    });
  }

  // Lightweight settings for the clinic settings page (doctor-accessible)
  async getClinicSettings(clinicId: number) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        logoUrl: true,
        settings: {
          select: {
            currency: true,
            timezone: true,
            workingHoursFrom: true,
            workingHoursTo: true,
            workingDays: true,
            branches: true,
          },
        },
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true,
        subscriptionInvoices: {
          orderBy: { dueDate: 'desc' },
          take: 1,
        },
      },
    });
    if (!clinic) throw new NotFoundException(`Clinic #${clinicId} not found`);

    let billingStatus = 'PENDING';
    let derivedSubscriptionStatus = clinic.subscriptionStatus;
    let trialEndsAt: Date | null = null;
    const cAny = clinic as any;

    if (clinic.subscriptionPlan === 'FREE') {
      billingStatus = 'PAID';
    } else if (cAny.subscriptionInvoices && cAny.subscriptionInvoices.length > 0) {
      const latestInvoice = cAny.subscriptionInvoices[0];
      if (latestInvoice.status === 'PAID') billingStatus = 'PAID';
      else if (latestInvoice.status === 'PENDING') {
        if (new Date(latestInvoice.dueDate) < new Date()) {
          billingStatus = 'OVERDUE';
        } else {
          billingStatus = 'PENDING';
        }
      } else {
        billingStatus = latestInvoice.status;
      }
    } else {
      if (clinic.subscriptionStatus === 'ACTIVE') billingStatus = 'PAID';
      else if (clinic.subscriptionStatus === 'TRIAL') {
        trialEndsAt = new Date(clinic.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
        if (trialEndsAt < new Date()) {
          billingStatus = 'OVERDUE';
          derivedSubscriptionStatus = 'SUSPENDED';
        } else {
          billingStatus = 'PENDING';
        }
      }
      else if (clinic.subscriptionStatus === 'SUSPENDED') billingStatus = 'OVERDUE';
    }

    return {
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      logoUrl: clinic.logoUrl,
      currency: clinic.settings?.currency ?? 'EGP',
      timezone: clinic.settings?.timezone ?? 'Africa/Cairo',
      workingHoursFrom: clinic.settings?.workingHoursFrom ?? '09:00 AM',
      workingHoursTo: clinic.settings?.workingHoursTo ?? '05:00 PM',
      workingDays: clinic.settings?.workingDays ?? '["Sat","Sun","Mon","Tue","Wed","Thu"]',
      branches: clinic.settings?.branches ?? '[]',
      subscriptionPlan: clinic.subscriptionPlan,
      subscriptionStatus: derivedSubscriptionStatus,
      billingStatus,
      trialEndsAt,
    };
  }

  async updateClinicSettings(clinicId: number, data: any) {
    const clinic = await this.prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) throw new NotFoundException(`Clinic #${clinicId} not found`);

    // Update clinic core fields
    const clinicUpdate: any = {};
    if (data.name !== undefined) clinicUpdate.name = data.name;
    if (data.address !== undefined) clinicUpdate.address = data.address;
    if (data.phone !== undefined) clinicUpdate.phone = data.phone;

    if (Object.keys(clinicUpdate).length > 0) {
      await this.prisma.clinic.update({ where: { id: clinicId }, data: clinicUpdate });
    }

    // Upsert settings (create if not exists)
    const settingsUpdate: any = {};
    if (data.currency !== undefined) settingsUpdate.currency = data.currency;
    if (data.timezone !== undefined) settingsUpdate.timezone = data.timezone;
    if (data.workingHoursFrom !== undefined) settingsUpdate.workingHoursFrom = data.workingHoursFrom;
    if (data.workingHoursTo !== undefined) settingsUpdate.workingHoursTo = data.workingHoursTo;
    if (data.workingDays !== undefined) settingsUpdate.workingDays = data.workingDays;
    if (data.branches !== undefined) settingsUpdate.branches = data.branches;

    if (Object.keys(settingsUpdate).length > 0) {
      await this.prisma.clinicSettings.upsert({
        where: { clinicId },
        create: {
          clinicId,
          currency: settingsUpdate.currency ?? 'EGP',
          timezone: settingsUpdate.timezone ?? 'Africa/Cairo',
          workingHoursFrom: settingsUpdate.workingHoursFrom ?? '09:00 AM',
          workingHoursTo: settingsUpdate.workingHoursTo ?? '05:00 PM',
          workingDays: settingsUpdate.workingDays ?? '["Sat","Sun","Mon","Tue","Wed","Thu"]',
          branches: settingsUpdate.branches ?? '[]',
        },
        update: settingsUpdate,
      });
    }

    return this.getClinicSettings(clinicId);
  }
}

