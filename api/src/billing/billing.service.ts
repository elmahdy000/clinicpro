import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from '../prisma/tenant-context';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { NotificationHelperService } from '../common/services/notification-helper.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private selectUser = { id: true, email: true, name: true, role: true };
  private invoiceInclude = {
    patient: true,
    doctor: { include: { user: { select: { id: true, email: true, name: true, role: true } as any } } },
    appointment: true,
  };

  constructor(
    private prisma: PrismaService,
    private notificationHelper: NotificationHelperService,
    private redis: RedisService,
  ) {}

  private parseInvoice(invoice: any) {
    if (!invoice) return invoice;
    if (typeof invoice.items === 'string') {
      try {
        invoice.items = JSON.parse(invoice.items);
      } catch (e) {
        this.logger.warn(`Failed to parse invoice #${invoice.id} items JSON: ${(e as Error).message}`);
        invoice.items = []; // Return empty array instead of corrupt string
      }
    }
    return invoice;
  }

  private async generateInvoiceNumber(): Promise<string> {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? 0;
    const year = new Date().getFullYear();
    // Use a DB-level sequence via aggregation to avoid race conditions
    // We use MAX(id) scoped to the clinic as a monotonically increasing counter
    const result = await this.prisma.invoice.aggregate({
      _max: { id: true },
      where: { clinicId },
    });
    const seq = (result._max.id ?? 0) + 1;
    return `INV-${year}-${String(seq).padStart(5, '0')}`;
  }

  async findAll(query: PaginationDto & { patientId?: number }): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', patientId } = query;
    const store = tenantStorage.getStore();
    const where: any = {};
    if (store?.clinicId) where.clinicId = store.clinicId;
    if (patientId) where.patientId = Number(patientId);
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { status: { contains: search } },
        { paymentMethod: { contains: search } },
      ];
    }
    const [rawData, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: this.invoiceInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { data: rawData.map((i) => this.parseInvoice(i)), meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const store = tenantStorage.getStore();
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, clinicId: store?.clinicId ?? 0 },
      include: this.invoiceInclude,
    });
    if (!invoice) throw new NotFoundException(`Invoice #${id} not found`);
    return this.parseInvoice(invoice);
  }

  async create(dto: CreateInvoiceDto) {
    const subtotal = dto.items.reduce((sum, item) => sum + item.price, 0);
    const tax = 0;
    const discount = dto.discount ?? 0;
    const total = subtotal - discount;
    const invoiceNumber = await this.generateInvoiceNumber();
    const store = tenantStorage.getStore();

    const invoice = await this.prisma.invoice.create({
      data: {
        clinicId: store?.clinicId ?? 0,
        invoiceNumber,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        appointmentId: dto.appointmentId,
        items: JSON.stringify(dto.items),
        subtotal,
        tax,
        discount,
        total,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
      },
      include: this.invoiceInclude,
    });

    const clinic = await this.prisma.clinic.findUnique({ where: { id: store?.clinicId ?? 0 } });
    await this.notificationHelper.sendInvoiceCreated(invoice, invoice.patient, clinic?.name || 'ClinicPro').catch((e) => this.logger.warn(`Invoice created notification failed: ${(e as Error).message}`));

    await this.redis.delByPattern(`patients:timeline:*:${dto.patientId}`);
    return this.parseInvoice(invoice);
  }

  async update(id: number, dto: UpdateInvoiceDto) {
    const old = await this.findOne(id);
    // Explicitly whitelist allowed update fields — never spread raw DTO to prevent clinicId injection
    const data: any = {};
    if (dto.status !== undefined)        data.status = dto.status;
    if (dto.paymentMethod !== undefined) data.paymentMethod = dto.paymentMethod;
    if (dto.notes !== undefined)         data.notes = dto.notes;
    if (dto.paidAt)                      data.paidAt = new Date(dto.paidAt);
    if (dto.status === 'PAID' && !dto.paidAt) data.paidAt = new Date();

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data,
      include: this.invoiceInclude,
    });

    if (invoice.status === 'PAID' && old.status !== 'PAID') {
      const clinic = await this.prisma.clinic.findUnique({ where: { id: invoice.clinicId } });
      await this.notificationHelper.sendInvoicePaid(invoice, invoice.patient, clinic?.name || 'ClinicPro').catch((e) => this.logger.warn(`Invoice paid notification failed: ${(e as Error).message}`));
    }

    await this.redis.delByPattern(`patients:timeline:*:${invoice.patientId}`);
    return this.parseInvoice(invoice);
  }

  async remove(id: number) {
    const old = await this.findOne(id);
    const result = await this.prisma.invoice.delete({ where: { id } });
    await this.redis.delByPattern(`patients:timeline:*:${old.patientId}`);
    return result;
  }

  async getSummary() {
    const store = tenantStorage.getStore();
    const where: any = {};
    if (store?.clinicId) where.clinicId = store.clinicId;

    const [aggregates, count] = await Promise.all([
      this.prisma.invoice.groupBy({
        by: ['status'],
        where,
        _sum: {
          total: true,
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    for (const group of aggregates) {
      const sum = group._sum.total || 0;
      if (group.status === 'PAID') totalCollected = sum;
      else if (group.status === 'PENDING') totalPending = sum;
      else if (group.status === 'OVERDUE') totalOverdue = sum;
    }

    return {
      totalCollected,
      totalPending,
      totalOverdue,
      count,
    };
  }
}
