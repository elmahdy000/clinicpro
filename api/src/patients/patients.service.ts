import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
    const where: any = {};
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

  async findOne(id: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: true,
        medicalRecords: true,
        prescriptions: true,
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });
    if (!patient) throw new NotFoundException(`Patient #${id} not found`);
    return patient;
  }

  async create(dto: CreatePatientDto) {
    return this.prisma.patient.create({ data: dto });
  }

  async update(id: number, dto: UpdatePatientDto) {
    await this.findOne(id);
    return this.prisma.patient.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.patient.delete({ where: { id } });
  }

  async getAppointments(patientId: number) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException(`Patient #${patientId} not found`);
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: { doctor: { include: { user: true } } },
    });
  }

  async getTimeline(patientId: number) {
    const key = `patients:timeline:${patientId}`;
    const cached = await this.redis.get<any[]>(key);
    if (cached) return cached;

    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException(`Patient #${patientId} not found`);

    const [appointments, medicalRecords, prescriptions, labTests, invoices] = await Promise.all([
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
      this.prisma.labTest.findMany({
        where: { patientId },
        include: { doctor: { include: { user: { select: { id: true, name: true } } } } },
        orderBy: { orderedDate: 'desc' },
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

    appointments.forEach((a) =>
      timeline.push({ type: 'APPOINTMENT', date: a.appointmentDate, data: a }),
    );
    medicalRecords.forEach((r) =>
      timeline.push({ type: 'MEDICAL_RECORD', date: r.createdAt, data: r }),
    );
    prescriptions.forEach((p) =>
      timeline.push({ type: 'PRESCRIPTION', date: p.prescribedDate, data: p }),
    );
    labTests.forEach((l) =>
      timeline.push({ type: 'LAB_TEST', date: l.orderedDate, data: l }),
    );
    invoices.forEach((i) =>
      timeline.push({ type: 'INVOICE', date: i.createdAt, data: i }),
    );

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    await this.redis.set(key, timeline, CACHE_TTL);
    return timeline;
  }
}
