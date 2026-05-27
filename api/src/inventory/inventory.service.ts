import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from '../prisma/tenant-context';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { NotificationHelperService } from '../common/services/notification-helper.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private notificationHelper: NotificationHelperService,
  ) {}

  async findAll(query: PaginationDto & { medicationId?: string; lowStock?: string }): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, search, medicationId, lowStock } = query;
    const store = tenantStorage.getStore();
    const where: any = { clinicId: store?.clinicId ?? 0 };
    if (medicationId) where.medicationId = parseInt(medicationId, 10);
    if (lowStock === 'true') where.quantityOnHand = { lte: 10 };
    if (search) {
      where.medication = { name: { contains: search } };
    }

    const [data, total] = await Promise.all([
      this.prisma.medicationStock.findMany({
        where,
        include: { medication: true, stockMovements: { take: 5, orderBy: { createdAt: 'desc' } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.medicationStock.count({ where }),
    ]);

    return {
      data: data.map((s) => ({
        ...s,
        expiryDate: s.expiryDate?.toISOString(),
        lastRestockedAt: s.lastRestockedAt?.toISOString(),
        isLowStock: s.quantityOnHand <= 10,
        isExpired: s.expiryDate ? new Date(s.expiryDate) < new Date() : false,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const store = tenantStorage.getStore();
    const item = await this.prisma.medicationStock.findFirst({
      where: { id, clinicId: store?.clinicId ?? 0 },
      include: {
        medication: true,
        stockMovements: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!item) throw new NotFoundException(`Stock item #${id} not found`);
    return item;
  }

  async create(data: {
    medicationId: number;
    quantityOnHand: number;
    batchNumber?: string;
    expiryDate?: string;
    location?: string;
  }) {
    if (!data.medicationId) throw new BadRequestException('medicationId is required');
    if (data.quantityOnHand < 0) throw new BadRequestException('quantityOnHand cannot be negative');
    if (!Number.isInteger(data.quantityOnHand)) throw new BadRequestException('quantityOnHand must be an integer');

    const medication = await this.prisma.medication.findUnique({ where: { id: data.medicationId } });
    if (!medication) throw new NotFoundException(`Medication #${data.medicationId} not found`);

    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? 0;

    const existing = await this.prisma.medicationStock.findFirst({
      where: { medicationId: data.medicationId, clinicId, batchNumber: data.batchNumber ?? null },
    });
    if (existing) throw new BadRequestException('Stock record already exists for this medication/batch. Use add-stock instead.');

    return this.prisma.medicationStock.create({
      data: {
        medicationId: data.medicationId,
        clinicId,
        quantityOnHand: data.quantityOnHand,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        location: data.location,
        lastRestockedAt: new Date(),
      },
      include: { medication: true },
    });
  }

  async addStock(id: number, quantity: number, notes?: string, performedBy?: number) {
    const item = await this.findOne(id);
    if (quantity <= 0) throw new BadRequestException('Quantity must be a positive number');
    const updated = await this.prisma.medicationStock.update({
      where: { id },
      data: {
        quantityOnHand: item.quantityOnHand + quantity,
        lastRestockedAt: new Date(),
      },
    });
    await this.prisma.stockMovement.create({
      data: {
        medicationStockId: id,
        type: 'IN',
        quantity,
        notes: notes || 'Manual restock',
        performedBy: performedBy ?? null,
      },
    });
    return updated;
  }

  async removeStock(id: number, quantity: number, referenceType?: string, referenceId?: number, performedBy?: number, notes?: string) {
    const item = await this.findOne(id);
    if (quantity <= 0) throw new BadRequestException('Quantity must be a positive number');
    if (item.quantityOnHand < quantity) {
      throw new BadRequestException(`Insufficient stock: have ${item.quantityOnHand}, need ${quantity}`);
    }
    const updated = await this.prisma.medicationStock.update({
      where: { id },
      data: { quantityOnHand: item.quantityOnHand - quantity },
    });
    await this.prisma.stockMovement.create({
      data: {
        medicationStockId: id,
        type: 'OUT',
        quantity: -quantity,
        referenceType: referenceType || 'manual',
        referenceId,
        notes: notes || `Dispensed ${quantity} units`,
        performedBy: performedBy ?? null,
      },
    });

    if (updated.quantityOnHand <= 10) {
      const admin = await this.prisma.user.findFirst({
        where: { clinicId: item.clinicId, role: 'CLINIC_ADMIN' },
      });
      if (admin) {
        await this.notificationHelper.sendMedicationLowStock(admin.id, item.medication.name, updated.quantityOnHand).catch(() => {});
      }
    }

    return updated;
  }

  async adjustStock(id: number, newQuantity: number, notes?: string, performedBy?: number) {
    const item = await this.findOne(id);
    if (newQuantity < 0) throw new BadRequestException('Stock quantity cannot be negative');
    const diff = newQuantity - item.quantityOnHand;
    const updated = await this.prisma.medicationStock.update({
      where: { id },
      data: { quantityOnHand: newQuantity },
    });
    await this.prisma.stockMovement.create({
      data: {
        medicationStockId: id,
        type: 'ADJUSTMENT',
        quantity: diff,
        notes: notes || `Adjusted from ${item.quantityOnHand} to ${newQuantity}`,
        performedBy: performedBy ?? null,
      },
    });

    if (updated.quantityOnHand <= 10) {
      const admin = await this.prisma.user.findFirst({
        where: { clinicId: item.clinicId, role: 'CLINIC_ADMIN' },
      });
      if (admin) {
        await this.notificationHelper.sendMedicationLowStock(admin.id, item.medication.name, updated.quantityOnHand).catch(() => {});
      }
    }

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.medicationStock.delete({ where: { id } });
  }

  async getLowStockItems() {
    const store = tenantStorage.getStore();
    const where: any = { clinicId: store?.clinicId ?? 0, quantityOnHand: { lte: 10 } };
    return this.prisma.medicationStock.findMany({
      where,
      include: { medication: true },
      orderBy: { quantityOnHand: 'asc' },
    });
  }

  async getExpiringSoon(days = 30) {
    const store = tenantStorage.getStore();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    return this.prisma.medicationStock.findMany({
      where: {
        clinicId: store?.clinicId ?? 0,
        expiryDate: { lte: threshold, gte: new Date() },
      },
      include: { medication: true },
      orderBy: { expiryDate: 'asc' },
    });
  }
}