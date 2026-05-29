import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from '../prisma/tenant-context';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { NotificationHelperService } from '../common/services/notification-helper.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class MedicalRecordsService {
  private readonly logger = new Logger(MedicalRecordsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationHelper: NotificationHelperService,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const store = tenantStorage.getStore();
    const where: any = { clinicId: store?.clinicId ?? 0 };
    if (search) {
      where.OR = [
        { diagnosis: { contains: search } },
        { chiefComplaint: { contains: search } },
      ];
    }
    const selectUser = { id: true, email: true, name: true, role: true };
    const include = { patient: true, doctor: { include: { user: { select: selectUser } } }, appointment: true };
    const [data, total] = await Promise.all([
      this.prisma.medicalRecord.findMany({
        where,
        include,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.medicalRecord.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const store = tenantStorage.getStore();
    const record = await this.prisma.medicalRecord.findFirst({
      where: { id, clinicId: store?.clinicId ?? 0 },
      include: {
        patient: true,
        doctor: { include: { user: { select: { id: true, email: true, name: true, role: true } } } },
        appointment: true,
        prescription: true,
      },
    });
    if (!record) throw new NotFoundException(`MedicalRecord #${id} not found`);
    return record;
  }

  async create(dto: CreateMedicalRecordDto) {
    const store = tenantStorage.getStore();
    const record = await this.prisma.medicalRecord.create({
      data: {
        ...dto,
        chiefComplaint: dto.chiefComplaint || '',
        diagnosis: dto.diagnosis || '',
        treatmentPlan: dto.treatmentPlan || '',
        notes: dto.notes || '',
        vitalSigns: dto.vitalSigns ? JSON.stringify(dto.vitalSigns) : '{}',
        clinicId: store?.clinicId ?? 0,
      },
    });

    if (dto.appointmentId) {
      const oldApt = await this.prisma.appointment.findUnique({ where: { id: dto.appointmentId }, select: { status: true } });
      await this.prisma.appointment.update({
        where: { id: dto.appointmentId },
        data: { status: 'COMPLETED' },
      }).catch((e) => this.logger.error(`Failed to update appointment status: ${e.message}`));
      if (oldApt && oldApt.status !== 'COMPLETED') {
        await this.prisma.appointmentStatusChange.create({
          data: {
            appointmentId: dto.appointmentId,
            fromStatus: oldApt.status,
            toStatus: 'COMPLETED',
          },
        });
      }
    }

    const full = await this.findOne(record.id);
    await this.notificationHelper.sendMedicalRecordCreated(full, full.doctor.user, full.patient).catch((e) => this.logger.warn(`Notification failed: ${(e as Error).message}`));
    return full;
  }

  async update(id: number, dto: UpdateMedicalRecordDto) {
    await this.findOne(id);
    return this.prisma.medicalRecord.update({
      where: { id },
      data: {
        ...dto,
        vitalSigns: dto.vitalSigns ? JSON.stringify(dto.vitalSigns) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.medicalRecord.delete({ where: { id } });
  }
}
