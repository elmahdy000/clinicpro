import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
    const where: any = {};
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
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id },
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
    const record = await this.prisma.medicalRecord.create({
      data: {
        ...dto,
        vitalSigns: dto.vitalSigns ? JSON.stringify(dto.vitalSigns) : '{}',
        clinicId: 1,
      },
    });

    if (dto.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: dto.appointmentId },
        data: { status: 'COMPLETED' },
      }).catch((e) => this.logger.error(`Failed to update appointment status: ${e.message}`));
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
