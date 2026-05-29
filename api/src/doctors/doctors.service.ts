import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { tenantStorage } from '../prisma/tenant-context';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateTimeOffDto } from './dto/create-timeoff.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

const CACHE_TTL_SLOTS = 60;
const CACHE_TTL_DAYS = 120;

@Injectable()
export class DoctorsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'id', sortOrder = 'desc' } = query;
    const store = tenantStorage.getStore();
    const where: any = { clinicId: store?.clinicId ?? 0 };
    const allowedSortFields = new Set(['id', 'specialization', 'consultationFee', 'status', 'userId', 'departmentId']);
    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : 'id';
    if (search) {
      where.OR = [
        { specialization: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        include: { user: { select: { id: true, email: true, name: true, role: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [safeSortBy]: sortOrder },
      }),
      this.prisma.doctor.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const store = tenantStorage.getStore();
    const doctor = await this.prisma.doctor.findFirst({
      where: { id, clinicId: store?.clinicId ?? 0 },
      include: { user: { select: { id: true, email: true, name: true, role: true } }, appointments: true },
    });
    if (!doctor) throw new NotFoundException(`Doctor #${id} not found`);
    return doctor;
  }

  async findByUserId(userId: number) {
    const store = tenantStorage.getStore();
    return this.prisma.doctor.findFirst({ where: { userId, clinicId: store?.clinicId ?? 0 } });
  }

  async create(dto: CreateDoctorDto) {
    const store = tenantStorage.getStore();
    return this.prisma.doctor.create({ data: { ...dto, clinicId: store?.clinicId ?? 0 } as any });
  }

  async update(id: number, dto: UpdateDoctorDto) {
    await this.findOne(id);
    return this.prisma.doctor.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.doctor.delete({ where: { id } });
  }

  async getAppointments(doctorId: number) {
    const store = tenantStorage.getStore();
    const doctor = await this.prisma.doctor.findFirst({
      where: { id: doctorId, clinicId: store?.clinicId ?? 0 },
    });
    if (!doctor) throw new NotFoundException(`Doctor #${doctorId} not found`);
    return this.prisma.appointment.findMany({ where: { doctorId } });
  }

  async getAvailability(doctorId: number) {
    await this.findOne(doctorId);
    return this.prisma.doctorAvailability.findMany({ where: { doctorId } });
  }

  async upsertAvailability(doctorId: number, dto: CreateAvailabilityDto, requestingUser?: any) {
    const doctor = await this.findOne(doctorId);
    if (requestingUser?.role === 'DOCTOR' && doctor.userId !== requestingUser.id) {
      throw new ForbiddenException('Cannot modify another doctor\'s availability');
    }
    return this.prisma.doctorAvailability.upsert({
      where: { doctorId_dayOfWeek: { doctorId, dayOfWeek: dto.dayOfWeek } },
      update: {
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDuration: dto.slotDuration ?? 30,
        isAvailable: dto.isAvailable ?? true,
      },
      create: {
        doctorId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDuration: dto.slotDuration ?? 30,
        isAvailable: dto.isAvailable ?? true,
      },
    });
  }

  async removeAvailability(doctorId: number, dayOfWeek: number, requestingUser?: any) {
    const doctor = await this.findOne(doctorId);
    if (requestingUser?.role === 'DOCTOR' && doctor.userId !== requestingUser.id) {
      throw new ForbiddenException('Cannot modify another doctor\'s availability');
    }
    try {
      await this.prisma.doctorAvailability.delete({
        where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
      });
    } catch {
      throw new NotFoundException(`Availability for day ${dayOfWeek} not found`);
    }
  }

  async getTimeOff(doctorId: number) {
    await this.findOne(doctorId);
    return this.prisma.doctorTimeOff.findMany({ where: { doctorId }, orderBy: { date: 'asc' } });
  }

  async addTimeOff(doctorId: number, dto: CreateTimeOffDto, requestingUser?: any) {
    const doctor = await this.findOne(doctorId);
    if (requestingUser?.role === 'DOCTOR' && doctor.userId !== requestingUser.id) {
      throw new ForbiddenException('Cannot add time-off for another doctor');
    }
    return this.prisma.doctorTimeOff.create({
      data: { doctorId, date: dto.date, reason: dto.reason },
    });
  }

  async removeTimeOff(id: number, requestingUser?: any) {
    const store = tenantStorage.getStore();
    const record = await this.prisma.doctorTimeOff.findFirst({
      where: { id, doctor: { clinicId: store?.clinicId ?? 0 } },
      include: { doctor: true }
    });
    if (!record) throw new NotFoundException(`TimeOff #${id} not found`);

    if (requestingUser?.role === 'DOCTOR' && record.doctor.userId !== requestingUser.id) {
      throw new ForbiddenException('Cannot remove another doctor\'s time-off');
    }

    return this.prisma.doctorTimeOff.delete({ where: { id } });
  }

  private async getClinicTimezone(): Promise<string> {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? 0;
    if (!clinicId) return 'Africa/Cairo';
    const settings = await this.prisma.clinicSettings.findUnique({
      where: { clinicId },
    });
    return settings?.timezone || 'Africa/Cairo';
  }

  private getLocalDateStr(date: Date, timezone: string): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  }

  private getLocalDayBoundsInUtc(dateStr: string, timezone: string) {
    const startLocal = new Date(`${dateStr}T00:00:00`);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(startLocal);
    const partValues: any = {};
    parts.forEach(p => partValues[p.type] = p.value);
    const tzDate = new Date(Date.UTC(
      Number(partValues.year),
      Number(partValues.month) - 1,
      Number(partValues.day),
      Number(partValues.hour),
      Number(partValues.minute),
      Number(partValues.second)
    ));
    const offsetMs = tzDate.getTime() - startLocal.getTime();
    const startUtc = new Date(startLocal.getTime() - offsetMs);
    const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1);
    return { startUtc, endUtc };
  }

  async getAvailableDays(
    doctorId: number,
    fromDate: string,
    toDate: string,
    durationMinutes?: number,
  ) {
    const key = `doctors:available-days:${doctorId}:${fromDate}:${toDate}:${durationMinutes || ''}`;
    const cached = await this.redis.get<string[]>(key);
    if (cached) return cached;

    await this.findOne(doctorId);
    const timezone = await this.getClinicTimezone();
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const { startUtc: startBound } = this.getLocalDayBoundsInUtc(fromDate, timezone);
    const { endUtc: endBound } = this.getLocalDayBoundsInUtc(toDate, timezone);

    const [timeOffs, availabilities, existingAppointments] = await Promise.all([
      this.prisma.doctorTimeOff.findMany({
        where: { doctorId, date: { gte: from, lte: to } },
        select: { date: true },
      }),
      this.prisma.doctorAvailability.findMany({
        where: { doctorId, isAvailable: true },
      }),
      this.prisma.appointment.findMany({
        where: {
          doctorId,
          appointmentDate: { gte: startBound, lt: endBound },
          status: { notIn: ['CANCELLED'] },
        },
        select: { appointmentDate: true, appointmentEndDate: true },
      }),
    ]);

    const timeOffDates = new Set(timeOffs.map((t) => t.date.toISOString().split('T')[0]));
    const availByDay = new Map(availabilities.map((a) => [a.dayOfWeek, a]));
    const days: { date: string; slots: string[] }[] = [];

    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();

      if (timeOffDates.has(dateStr)) continue;
      const availability = availByDay.get(dayOfWeek);
      if (!availability) continue;

      const [startH, startM] = availability.startTime.split(':').map(Number);
      const [endH, endM] = availability.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const slotDur = durationMinutes ?? availability.slotDuration;
      const slots: string[] = [];

      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayAppointments = existingAppointments.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate >= dayStart && aptDate <= dayEnd;
      });

      for (let m = startMinutes; m + slotDur <= endMinutes; m += slotDur) {
        const slotStart = new Date(d);
        slotStart.setHours(Math.floor(m / 60), m % 60, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + slotDur * 60000);

        const conflict = dayAppointments.some((apt) => {
          const aptStart = new Date(apt.appointmentDate).getTime();
          const aptEnd = new Date(apt.appointmentEndDate).getTime();
          return slotStart.getTime() < aptEnd && slotEnd.getTime() > aptStart;
        });

        if (!conflict) {
          const hh = String(Math.floor(m / 60)).padStart(2, '0');
          const mm = String(m % 60).padStart(2, '0');
          slots.push(`${hh}:${mm}`);
        }
      }

      if (slots.length > 0) {
        days.push({ date: dateStr, slots });
      }
    }
    const result = days;
    await this.redis.set(key, result, CACHE_TTL_DAYS);
    return result;
  }

  async getAvailableSlots(doctorId: number, dateStr: string, durationMinutes?: number) {
    const key = `doctors:available-slots:${doctorId}:${dateStr}:${durationMinutes || ''}`;
    const cached = await this.redis.get<string[]>(key);
    if (cached) return cached;

    await this.findOne(doctorId);
    const timezone = await this.getClinicTimezone();
    const todayStr = this.getLocalDateStr(new Date(), timezone);
    if (dateStr < todayStr) return [];

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    const isOff = await this.prisma.doctorTimeOff.findUnique({
      where: { doctorId_date: { doctorId, date: new Date(dateStr) } },
    });
    if (isOff) return [];

    const availability = await this.prisma.doctorAvailability.findUnique({
      where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
    });
    if (!availability || !availability.isAvailable) return [];

    const { startUtc, endUtc } = this.getLocalDayBoundsInUtc(dateStr, timezone);

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: startUtc,
          lt: endUtc,
        },
        status: { notIn: ['CANCELLED'] },
      },
      select: { appointmentDate: true, appointmentEndDate: true },
    });

    const slots: string[] = [];
    const [startH, startM] = availability.startTime.split(':').map(Number);
    const [endH, endM] = availability.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const slotDur = durationMinutes ?? availability.slotDuration;

    for (let m = startMinutes; m + slotDur <= endMinutes; m += slotDur) {
      const slotStart = new Date(date);
      slotStart.setHours(Math.floor(m / 60), m % 60, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + slotDur * 60000);

      const conflict = existingAppointments.some((apt) => {
        const aptStart = new Date(apt.appointmentDate).getTime();
        const aptEnd = new Date(apt.appointmentEndDate).getTime();
        return slotStart.getTime() < aptEnd && slotEnd.getTime() > aptStart;
      });

      if (!conflict) {
        const hh = String(Math.floor(m / 60)).padStart(2, '0');
        const mm = String(m % 60).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }
    }

    await this.redis.set(key, slots, CACHE_TTL_SLOTS);
    return slots;
  }
}
