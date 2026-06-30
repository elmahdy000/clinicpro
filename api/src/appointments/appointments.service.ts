import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { tenantStorage } from '../prisma/tenant-context';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { NotificationHelperService } from '../common/services/notification-helper.service';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { parseLocalToUtc, getLocalDayBoundsInUtc, getLocalDateStr } from '../common/helpers/timezone.helper';

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

  async findAll(query: AppointmentQueryDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'appointmentDate', sortOrder = 'desc', appointmentDateFrom, appointmentDateTo, doctorId } = query;
    const store = tenantStorage.getStore();
    const where: any = { clinicId: store?.clinicId ?? 0 };
    const allowedSortFields = new Set(['id', 'appointmentDate', 'appointmentEndDate', 'status', 'type', 'durationMinutes', 'createdAt']);
    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : 'appointmentDate';
    if (doctorId) where.doctorId = doctorId;
    if (appointmentDateFrom || appointmentDateTo) {
      const timezone = await this.getClinicTimezone();
      where.appointmentDate = {};
      if (appointmentDateFrom) {
        const { startUtc } = getLocalDayBoundsInUtc(appointmentDateFrom, timezone);
        where.appointmentDate.gte = startUtc;
      }
      if (appointmentDateTo) {
        const { endUtc } = getLocalDayBoundsInUtc(appointmentDateTo, timezone);
        where.appointmentDate.lte = endUtc;
      }
    }
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
        orderBy: { [safeSortBy]: sortOrder },
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
        `Time slot overlaps with appointment #${conflicts.id} (${new Date(conflicts.appointmentDate).toISOString()} - ${new Date(conflicts.appointmentEndDate).toISOString()})`,
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

  private async getNextQueuePosition(doctorId: number): Promise<number> {
    const timezone = await this.getClinicTimezone();
    const todayStr = getLocalDateStr(new Date(), timezone);
    const { startUtc, endUtc } = getLocalDayBoundsInUtc(todayStr, timezone);
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

    const timezone = await this.getClinicTimezone();
    const startUtc = parseLocalToUtc(dto.appointmentDate, timezone);
    const endUtc = new Date(startUtc.getTime() + dto.durationMinutes * 60000);
    await this.checkOverlap(dto.doctorId, startUtc, endUtc);
    const appointment = await this.prisma.appointment.create({
      data: {
        ...dto,
        appointmentDate: startUtc,
        appointmentEndDate: endUtc,
        clinicId,
      } as any,
    });
    const full = await this.findOne(appointment.id);
    await this.notificationHelper.sendAppointmentCreated(full, full.doctor.user, full.patient).catch((e) => this.logger.warn(`Notification failed: ${(e as Error).message}`));
    await this.evictDoctorCache(dto.doctorId, getLocalDateStr(startUtc, timezone));
    await this.redis.delByPattern(`patients:timeline:*:${dto.patientId}`);
    return full;
  }

  async update(id: number, dto: UpdateAppointmentDto, userId?: number) {
    const old = await this.findOne(id);
    const data: any = { ...dto };

    if (dto.appointmentDate || dto.durationMinutes) {
      const timezone = await this.getClinicTimezone();
      const startUtc = dto.appointmentDate 
        ? parseLocalToUtc(dto.appointmentDate, timezone) 
        : new Date(old.appointmentDate);
      const duration = dto.durationMinutes ?? old.durationMinutes ?? 30;
      const endUtc = new Date(startUtc.getTime() + duration * 60000);
      data.appointmentDate = startUtc;
      data.appointmentEndDate = endUtc;
      await this.checkOverlap(old.doctorId, startUtc, endUtc, id);
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

    if (dto.status === AppointmentStatus.CANCELLED) {
      await this.notificationHelper.sendAppointmentCancelled(full, full.doctor.user, full.patient).catch((e) => this.logger.warn(`Notification failed: ${(e as Error).message}`));
    } else if (dto.status === AppointmentStatus.IN_PROGRESS && old.status !== AppointmentStatus.IN_PROGRESS) {
      await this.notificationHelper.sendQueuePositionCalled(full.patient, full.doctor.user.name, full.queuePosition || 1).catch((e) => this.logger.warn(`Queue notification failed: ${(e as Error).message}`));
    } else if (data.appointmentDate && Math.abs(data.appointmentDate.getTime() - old.appointmentDate.getTime()) > 1000) {
      await this.notificationHelper.sendAppointmentUpdated(full, full.doctor.user, full.patient, old.appointmentDate.toISOString(), dto.reason).catch((e) => this.logger.warn(`Notification failed: ${(e as Error).message}`));
    }
    const timezone = await this.getClinicTimezone();
    await this.evictDoctorCache(old.doctorId, getLocalDateStr(full.appointmentDate, timezone));
    await this.redis.delByPattern(`patients:timeline:*:${full.patientId}`);
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

    const timezone = await this.getClinicTimezone();
    const startUtc = dto.appointmentDate
      ? parseLocalToUtc(dto.appointmentDate, timezone)
      : new Date(old.appointmentDate);
    const duration = dto.durationMinutes || old.durationMinutes;
    const endUtc = new Date(startUtc.getTime() + duration * 60000);
    data.appointmentDate = startUtc;
    data.appointmentEndDate = endUtc;

    await this.checkOverlap(old.doctorId, startUtc, endUtc, id);

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
    await this.evictDoctorCache(old.doctorId, getLocalDateStr(full.appointmentDate, timezone));
    await this.redis.delByPattern(`patients:timeline:*:${full.patientId}`);
    return full;
  }

  async remove(id: number) {
    const old = await this.findOne(id);
    await this.prisma.appointment.delete({ where: { id } });
    const timezone = await this.getClinicTimezone();
    await this.evictDoctorCache(old.doctorId, getLocalDateStr(old.appointmentDate, timezone));
    await this.redis.delByPattern(`patients:timeline:*:${old.patientId}`);
  }

  async findToday() {
    const store = tenantStorage.getStore();
    const timezone = await this.getClinicTimezone();
    const todayStr = getLocalDateStr(new Date(), timezone);
    const { startUtc, endUtc } = getLocalDayBoundsInUtc(todayStr, timezone);
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

  async getQueue(doctorId?: number) {
    const store = tenantStorage.getStore();
    const timezone = await this.getClinicTimezone();
    const todayStr = getLocalDateStr(new Date(), timezone);
    const { startUtc, endUtc } = getLocalDayBoundsInUtc(todayStr, timezone);
    const where: any = {
      clinicId: store?.clinicId ?? 0,
      appointmentDate: { gte: startUtc, lt: endUtc },
      status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS] },
      queuePosition: { not: null },
    };
    if (doctorId) where.doctorId = doctorId;
    return this.prisma.appointment.findMany({
      where,
      include: { patient: true, doctor: { include: { user: { select: { id: true, name: true } } } } },
      orderBy: [{ queuePosition: 'asc' }, { appointmentDate: 'asc' }],
    });
  }

  /** Mark an appointment as IN_PROGRESS (calling the patient in) and notify them. */
  async callPatient(id: number, userId?: number) {
    const appointment = await this.findOne(id);
    if (appointment.status === AppointmentStatus.IN_PROGRESS) return appointment;
    return this.update(id, { status: AppointmentStatus.IN_PROGRESS } as UpdateAppointmentDto, userId);
  }

  async markNoShows() {
    const store = tenantStorage.getStore();
    const now = new Date();
    // Grace period: only mark as missed if the appointment ended more than 10 minutes ago
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const timezone = await this.getClinicTimezone();
    const todayStr = getLocalDateStr(now, timezone);
    const { startUtc } = getLocalDayBoundsInUtc(todayStr, timezone);

    // Find appointments that:
    // 1. Started today
    // 2. Are still PENDING or CONFIRMED (not yet seen or started)
    // 3. Whose END time is at least 10 minutes in the past (fully elapsed + grace period)
    const overdue = await this.prisma.appointment.findMany({
      where: {
        clinicId: store?.clinicId ?? 0,
        appointmentDate: { gte: startUtc },
        appointmentEndDate: { lte: tenMinAgo },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
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