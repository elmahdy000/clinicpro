import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { tenantStorage } from '../prisma/tenant-context';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { NotificationHelperService } from '../common/services/notification-helper.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notificationHelper: NotificationHelperService,
  ) {}

  private async evictDoctorCache(doctorId: number, dateStr?: string) {
    await this.redis.delByPattern(`doctors:available-days:${doctorId}:*`);
    await this.redis.delByPattern(`doctors:available-slots:${doctorId}:*`);
    await this.redis.del('dashboard:stats');
  }

  private async logStatusChange(appointmentId: number, fromStatus: string, toStatus: string, userId?: number) {
    await this.prisma.appointmentStatusChange.create({
      data: { appointmentId, fromStatus, toStatus, changedByUserId: userId },
    });
  }

  async findAll(query: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'appointmentDate', sortOrder = 'desc' } = query;
    const store = tenantStorage.getStore();
    const where: any = { clinicId: store?.clinicId ?? 0 };
    if (search) {
      where.OR = [
        { type: { contains: search } },
        { status: { contains: search } },
        { reason: { contains: search } },
      ];
    }
    const selectUser = { id: true, email: true, name: true, role: true };
    const include = { patient: true, doctor: { include: { user: { select: selectUser } } } };
    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.appointment.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const store = tenantStorage.getStore();
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, clinicId: store?.clinicId ?? 0 },
      include: { patient: true, doctor: { include: { user: { select: { id: true, email: true, name: true, role: true } } } } },
    });
    if (!appointment) throw new NotFoundException(`Appointment #${id} not found`);
    return appointment;
  }

  private calculateEndDate(startDate: string, durationMinutes: number): Date {
    const end = new Date(startDate);
    end.setMinutes(end.getMinutes() + durationMinutes);
    return end;
  }

  private async checkOverlap(
    doctorId: number,
    startDate: Date,
    endDate: Date,
    excludeId?: number,
  ): Promise<void> {
    const conflicts = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        status: { notIn: ['CANCELLED', 'MISSED'] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
        appointmentDate: { lt: endDate },
        appointmentEndDate: { gt: startDate },
      },
    });
    if (conflicts) {
      throw new BadRequestException(
        `Time slot overlaps with appointment #${conflicts.id} (${new Date(conflicts.appointmentDate).toLocaleTimeString()} - ${new Date(conflicts.appointmentEndDate).toLocaleTimeString()})`,
      );
    }
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

  private async getNextQueuePosition(doctorId: number): Promise<number> {
    const timezone = await this.getClinicTimezone();
    const todayStr = this.getLocalDateStr(new Date(), timezone);
    const { startUtc, endUtc } = this.getLocalDayBoundsInUtc(todayStr, timezone);
    const lastToday = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: {
          gte: startUtc,
          lt: endUtc,
        },
        queuePosition: { not: null },
      },
      orderBy: { queuePosition: 'desc' },
    });
    return (lastToday?.queuePosition || 0) + 1;
  }

  async create(dto: CreateAppointmentDto) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? 0;

    if (!clinicId) {
      throw new BadRequestException('Clinic context is missing. Please ensure you are logged in under a clinic context.');
    }

    // Verify Clinic exists
    const clinicExists = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });
    if (!clinicExists) {
      throw new NotFoundException(`Clinic #${clinicId} not found`);
    }

    // Verify Patient exists
    const patientExists = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patientExists) {
      throw new NotFoundException(`Patient #${dto.patientId} not found`);
    }

    // Verify Doctor exists
    const doctorExists = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctorExists) {
      throw new NotFoundException(`Doctor #${dto.doctorId} not found`);
    }

    const appointmentEndDate = this.calculateEndDate(dto.appointmentDate, dto.durationMinutes);
    await this.checkOverlap(dto.doctorId, new Date(dto.appointmentDate), appointmentEndDate);
    const appointment = await this.prisma.appointment.create({
      data: { ...dto, appointmentEndDate, clinicId } as any,
    });
    const full = await this.findOne(appointment.id);
    await this.notificationHelper.sendAppointmentCreated(full, full.doctor.user, full.patient).catch((e) => this.logger.warn(`Notification failed: ${(e as Error).message}`));
    await this.evictDoctorCache(dto.doctorId, dto.appointmentDate);
    return full;
  }

  async update(id: number, dto: UpdateAppointmentDto, userId?: number) {
    const old = await this.findOne(id);
    const data: any = { ...dto };

    if (dto.appointmentDate || dto.durationMinutes) {
      const startDate = new Date(dto.appointmentDate || old.appointmentDate);
      const duration = dto.durationMinutes || old.durationMinutes;
      const endDate = this.calculateEndDate(startDate.toISOString(), duration);
      data.appointmentEndDate = endDate;
      await this.checkOverlap(old.doctorId, startDate, endDate, id);
    }

    if (dto.status && dto.status !== old.status) {
      if (dto.status === AppointmentStatus.CONFIRMED && old.status === AppointmentStatus.PENDING) {
        data.queuePosition = await this.getNextQueuePosition(old.doctorId);
        data.queueJoinedAt = new Date();
      }
      await this.logStatusChange(id, old.status, dto.status, userId);
    }

    const appointment = await this.prisma.appointment.update({ where: { id }, data });
    const full = await this.findOne(appointment.id);

    if (dto.status === 'CANCELLED') {
      await this.notificationHelper.sendAppointmentCancelled(full, full.doctor.user, full.patient).catch((e) => this.logger.warn(`Notification failed: ${(e as Error).message}`));
    } else if (dto.status === 'IN_PROGRESS' && old.status !== 'IN_PROGRESS') {
      await this.notificationHelper.sendQueuePositionCalled(full.patient, full.doctor.user.name, full.queuePosition || 1).catch((e) => this.logger.warn(`Queue notification failed: ${(e as Error).message}`));
    } else if (dto.appointmentDate && Math.abs(new Date(dto.appointmentDate).getTime() - old.appointmentDate.getTime()) > 1000) {
      await this.notificationHelper.sendAppointmentUpdated(full, full.doctor.user, full.patient, old.appointmentDate.toISOString(), dto.reason).catch((e) => this.logger.warn(`Notification failed: ${(e as Error).message}`));
    }
    await this.evictDoctorCache(old.doctorId, dto.appointmentDate || old.appointmentDate.toISOString().split('T')[0]);
    return full;
  }

  async reschedule(id: number, dto: RescheduleAppointmentDto, userId?: number) {
    const old = await this.findOne(id);

    if (old.status === AppointmentStatus.CANCELLED || old.status === AppointmentStatus.COMPLETED || old.status === AppointmentStatus.MISSED) {
      throw new BadRequestException(`Cannot reschedule a ${old.status.toLowerCase()} appointment`);
    }

    const data: any = { appointmentDate: dto.appointmentDate };
    if (dto.durationMinutes !== undefined) data.durationMinutes = dto.durationMinutes;
    if (dto.reason !== undefined) data.reason = dto.reason;

    const startDate = new Date(dto.appointmentDate || old.appointmentDate);
    const duration = dto.durationMinutes || old.durationMinutes;
    const endDate = this.calculateEndDate(startDate.toISOString(), duration);
    data.appointmentEndDate = endDate;

    await this.checkOverlap(old.doctorId, startDate, endDate, id);

    if (old.status !== dto.rescheduleStatus && dto.rescheduleStatus) {
      data.status = dto.rescheduleStatus;
      await this.logStatusChange(id, old.status, dto.rescheduleStatus, userId);
    }

    const appointment = await this.prisma.appointment.update({ where: { id }, data });
    const full = await this.findOne(appointment.id);

    await this.notificationHelper.sendAppointmentUpdated(
      full,
      full.doctor.user,
      full.patient,
      old.appointmentDate.toISOString(),
      dto.reason,
    ).catch((e) => this.logger.warn(`Notification failed: ${(e as Error).message}`));
    await this.evictDoctorCache(old.doctorId, dto.appointmentDate || old.appointmentDate.toISOString().split('T')[0]);
    return full;
  }

  async remove(id: number) {
    const old = await this.findOne(id);
    await this.prisma.appointment.delete({ where: { id } });
    await this.evictDoctorCache(old.doctorId, old.appointmentDate.toISOString().split('T')[0]);
  }

  async findToday() {
    const store = tenantStorage.getStore();
    const timezone = await this.getClinicTimezone();
    const todayStr = this.getLocalDateStr(new Date(), timezone);
    const { startUtc, endUtc } = this.getLocalDayBoundsInUtc(todayStr, timezone);
    return this.prisma.appointment.findMany({
      where: {
        clinicId: store?.clinicId ?? 0,
        appointmentDate: { gte: startUtc, lt: endUtc },
      },
      include: { patient: true, doctor: { include: { user: { select: { id: true, email: true, name: true, role: true } } } } },
    });
  }

  async findUpcoming() {
    const store = tenantStorage.getStore();
    const now = new Date();
    return this.prisma.appointment.findMany({
      where: {
        clinicId: store?.clinicId ?? 0,
        appointmentDate: { gt: now },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS] },
      },
      include: { patient: true, doctor: { include: { user: { select: { id: true, email: true, name: true, role: true } } } } },
    });
  }

  async markNoShows() {
    const store = tenantStorage.getStore();
    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const timezone = await this.getClinicTimezone();
    const todayStr = this.getLocalDateStr(now, timezone);
    const { startUtc } = this.getLocalDayBoundsInUtc(todayStr, timezone);

    const overdue = await this.prisma.appointment.findMany({
      where: {
        clinicId: store?.clinicId ?? 0,
        appointmentDate: { gte: startUtc, lt: tenMinAgo },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        appointmentEndDate: { lt: tenMinAgo },
      },
    });

    for (const apt of overdue) {
      await this.prisma.appointment.update({
        where: { id: apt.id },
        data: { status: AppointmentStatus.MISSED },
      });
      await this.logStatusChange(apt.id, apt.status, AppointmentStatus.MISSED);
      this.logger.log(`Appointment #${apt.id} auto-marked as MISSED (no-show)`);
    }

    return { marked: overdue.length };
  }
}