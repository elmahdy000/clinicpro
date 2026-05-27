import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from '../prisma/tenant-context';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { NotificationHelperService } from '../common/services/notification-helper.service';

@Injectable()
export class BillingService {
  private selectUser = { id: true, email: true, name: true, role: true };
  private invoiceInclude = {
    patient: true,
    doctor: { include: { user: { select: { id: true, email: true, name: true, role: true } as any } } },
    appointment: true,
  };

  constructor(
    private prisma: PrismaService,
    private notificationHelper: NotificationHelperService,
  ) {}

  private parseInvoice(invoice: any) {
    if (!invoice) return invoice;
    try {
      invoice.items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
    } catch {}
    return invoice;
  }

  private async generateInvoiceNumber(): Promise<string> {
    const store = tenantStorage.getStore();
    const count = await this.prisma.invoice.count({
      where: { clinicId: store?.clinicId ?? 0 },
    });
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async findAll(query: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const store = tenantStorage.getStore();
    const where: any = {};
    if (store?.clinicId) where.clinicId = store.clinicId;
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
    const subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = dto.tax ?? 0;
    const discount = dto.discount ?? 0;
    const total = subtotal + tax - discount;
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
    await this.notificationHelper.sendInvoiceCreated(invoice, invoice.patient, clinic?.name || 'ClinicPro').catch(() => {});

    return this.parseInvoice(invoice);
  }

  async update(id: number, dto: UpdateInvoiceDto) {
    const old = await this.findOne(id);
    const data: any = { ...dto };
    if (dto.paidAt) data.paidAt = new Date(dto.paidAt);
    if (dto.status === 'PAID' && !dto.paidAt) data.paidAt = new Date();
    const invoice = await this.prisma.invoice.update({
      where: { id },
      data,
      include: this.invoiceInclude,
    });

    if (invoice.status === 'PAID' && old.status !== 'PAID') {
      const clinic = await this.prisma.clinic.findUnique({ where: { id: invoice.clinicId } });
      await this.notificationHelper.sendInvoicePaid(invoice, invoice.patient, clinic?.name || 'ClinicPro').catch(() => {});
    }

    return this.parseInvoice(invoice);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.invoice.delete({ where: { id } });
  }

  async getSummary() {
    const store = tenantStorage.getStore();
    const where: any = {};
    if (store?.clinicId) where.clinicId = store.clinicId;

    const invoices = await this.prisma.invoice.findMany({
      where,
      select: { status: true, total: true, createdAt: true },
    });

    const collected = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.total, 0);
    const pending = invoices.filter((i) => i.status === 'PENDING').reduce((s, i) => s + i.total, 0);
    const overdue = invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.total, 0);

    return { totalCollected: collected, totalPending: pending, totalOverdue: overdue, count: invoices.length };
  }
}
