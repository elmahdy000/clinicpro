import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from '../prisma/tenant-context';
import { RedisService } from '../redis/redis.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

const CACHE_TTL = 120; // 2 minutes

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId;

    const where: any = {};
    if (clinicId) {
      where.clinics = { some: { clinicId } };
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        include: { appointments: true, user: { select: { id: true, email: true, name: true, role: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.patient.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async globalSearch(query: string) {
    if (!query || query.trim().length < 3) return [];
    
    return tenantStorage.run({ clinicId: null }, async () => {
      return this.prisma.patient.findMany({
        where: {
          OR: [
            { phone: { contains: query } },
            { nationalId: { contains: query } },
          ],
        },
        include: {
          clinics: { include: { clinic: { select: { id: true, name: true } } } },
          medicalRecords: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { doctor: { select: { specialization: true, user: { select: { name: true } } } } },
          },
          prescriptions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { doctor: { select: { user: { select: { name: true } } } } },
          },
        },
        take: 10,
      });
    });
  }

  async findOne(id: number) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId;
    
    const patient = await this.prisma.patient.findFirst({
      where: { id, clinics: clinicId ? { some: { clinicId } } : undefined },
      include: {
        appointments: true,
        medicalRecords: true,
        prescriptions: true,
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });
    if (!patient) throw new NotFoundException(`Patient #${id} not found in your clinic`);
    return patient;
  }

  async create(dto: CreatePatientDto) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId;

    const patientData = { ...dto } as any;
    if (patientData.dateOfBirth && String(patientData.dateOfBirth).trim() !== '') {
      patientData.dateOfBirth = new Date(patientData.dateOfBirth);
    } else {
      delete patientData.dateOfBirth;
    }

    let patient = null;
    if (dto.phone) patient = await this.prisma.patient.findUnique({ where: { phone: dto.phone } });
    
    if (!patient) {
      patient = await this.prisma.patient.create({ data: patientData });
    } else {
      patient = await this.prisma.patient.update({ where: { id: patient.id }, data: patientData });
    }

    if (clinicId) {
      await this.prisma.clinicPatient.upsert({
        where: { clinicId_patientId: { clinicId, patientId: patient.id } },
        create: { clinicId, patientId: patient.id },
        update: {}
      });
    }

    return patient;
  }

  async update(id: number, dto: UpdatePatientDto) {
    await this.findOne(id);
    const patientData = { ...dto } as any;
    if (patientData.dateOfBirth && String(patientData.dateOfBirth).trim() !== '') {
      patientData.dateOfBirth = new Date(patientData.dateOfBirth);
    } else {
      delete patientData.dateOfBirth;
    }
    return this.prisma.patient.update({ where: { id }, data: patientData });
  }

  async remove(id: number) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId;
    await this.findOne(id); // Ensures the patient belongs to the clinic

    if (clinicId) {
      await this.prisma.clinicPatient.delete({
        where: { clinicId_patientId: { clinicId, patientId: id } }
      });
      return { success: true, message: 'Patient unlinked from your clinic' };
    } else {
      return this.prisma.patient.delete({ where: { id } });
    }
  }

  async linkPatient(id: number) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId;
    if (!clinicId) throw new NotFoundException('Clinic context missing');

    const patient = await tenantStorage.run({ clinicId: null }, () =>
      this.prisma.patient.findUnique({ where: { id } })
    );

    if (!patient) throw new NotFoundException('Patient not found globally');

    // Link patient to the current clinic
    await this.prisma.clinicPatient.upsert({
      where: { clinicId_patientId: { clinicId, patientId: id } },
      update: {},
      create: { clinicId, patientId: id },
    });

    return patient;
  }

  async getAppointments(patientId: number) {
    const store = tenantStorage.getStore();
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, clinics: store?.clinicId ? { some: { clinicId: store.clinicId } } : undefined },
    });
    if (!patient) throw new NotFoundException(`Patient #${patientId} not found`);
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: { doctor: { include: { user: true } } },
    });
  }

  async getTimeline(patientId: number) {
    const store = tenantStorage.getStore();
    const key = `patients:timeline:${patientId}`;
    const cached = await this.redis.get<any[]>(key);
    if (cached) return cached;

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, clinics: store?.clinicId ? { some: { clinicId: store.clinicId } } : undefined },
    });
    if (!patient) throw new NotFoundException(`Patient #${patientId} not found`);

    const [appointments, medicalRecords, prescriptions, invoices] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { patientId },
        include: { doctor: { include: { user: { select: { id: true, name: true } } } } },
        orderBy: { appointmentDate: 'desc' },
      }),
      this.prisma.medicalRecord.findMany({
        where: { patientId },
        include: { doctor: { include: { user: { select: { id: true, name: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prescription.findMany({
        where: { patientId },
        include: { doctor: { include: { user: { select: { id: true, name: true } } } } },
        orderBy: { prescribedDate: 'desc' },
      }),
      (await this.prisma.invoice.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      })).map((inv) => {
        try { inv.items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items; } catch {}
        return inv;
      }),
    ]);

    const timeline: any[] = [];

    appointments.forEach((a: any) =>
      timeline.push({ type: 'APPOINTMENT', date: a.appointmentDate, data: a }),
    );
    medicalRecords.forEach((r: any) =>
      timeline.push({ type: 'MEDICAL_RECORD', date: r.createdAt, data: r }),
    );
    prescriptions.forEach((p: any) =>
      timeline.push({ type: 'PRESCRIPTION', date: p.prescribedDate, data: p }),
    );
    invoices.forEach((i: any) =>
      timeline.push({ type: 'INVOICE', date: i.createdAt, data: i }),
    );

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    await this.redis.set(key, timeline, CACHE_TTL);
    return timeline;
  }
}
