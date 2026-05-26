import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from '../prisma/tenant-context';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { NotificationHelperService } from '../common/services/notification-helper.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);

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
        { notes: { contains: search } },
      ];
    }
    const selectUser = { id: true, email: true, name: true, role: true };
    const include = { patient: true, doctor: { include: { user: { select: selectUser } } }, medicalRecord: true };
    const [data, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        include,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.prescription.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const store = tenantStorage.getStore();
    const prescription = await this.prisma.prescription.findFirst({
      where: { id, clinicId: store?.clinicId ?? 0 },
      include: {
        patient: true,
        doctor: { include: { user: { select: { id: true, email: true, name: true, role: true } } } },
        medicalRecord: true,
        clinic: { select: { id: true, name: true, logoUrl: true, address: true, phone: true } },
      },
    });
    if (!prescription) throw new NotFoundException(`Prescription #${id} not found`);
    if (typeof prescription.medications === 'string') {
      try { prescription.medications = JSON.parse(prescription.medications); } catch {}
    }
    return prescription;
  }

  private async resolveMedicationId(item: any): Promise<number | null> {
    if (item.medicationId) {
      return item.medicationId;
    }
    if (!item.name || !item.name.trim()) {
      return null;
    }
    const name = item.name.trim();
    let med = await this.prisma.medication.findUnique({
      where: { name },
    });
    if (!med) {
      try {
        med = await this.prisma.medication.create({
          data: {
            name,
            isGlobal: false,
          },
        });
      } catch (e) {
        med = await this.prisma.medication.findUnique({
          where: { name },
        });
      }
    }
    return med?.id || null;
  }

  private async decrementStock(medicationId: number, clinicId: number, quantity: number = 1) {
    try {
      const stock = await this.prisma.medicationStock.findFirst({
        where: {
          medicationId,
          clinicId,
          quantityOnHand: { gte: quantity },
          OR: [
            { expiryDate: null },
            { expiryDate: { gt: new Date() } },
          ],
        },
        orderBy: { expiryDate: 'asc' },
      });
      if (stock) {
        await this.prisma.medicationStock.update({
          where: { id: stock.id },
          data: { quantityOnHand: stock.quantityOnHand - quantity },
        });
        await this.prisma.stockMovement.create({
          data: {
            medicationStockId: stock.id,
            type: 'OUT',
            quantity: -quantity,
            referenceType: 'prescription',
            notes: `Auto-deducted ${quantity} unit(s) via prescription`,
            performedBy: 0,
          },
        });
      }
    } catch (e) {
      this.logger.warn(`Failed to decrement stock for medication #${medicationId}: ${(e as Error).message}`);
    }
  }

  async create(dto: CreatePrescriptionDto) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? 0;
    const data: any = { ...dto };
    const items = data.medications || [];
    if (data.medications && typeof data.medications !== 'string') {
      data.medications = JSON.stringify(data.medications);
    }
    const prescription = await this.prisma.prescription.create({ data: { ...data, clinicId } });
    
    const itemsToCreate = [];
    if (Array.isArray(items)) {
      for (const item of items) {
        const medId = await this.resolveMedicationId(item);
        if (medId) {
          itemsToCreate.push({
            prescriptionId: prescription.id,
            medicationId: medId,
            dosage: item.dosage || '',
            frequency: item.frequency || '',
            duration: item.duration || '',
          });
          await this.decrementStock(medId, clinicId);
        }
      }
    }
      
    if (itemsToCreate.length > 0) {
      await Promise.all(itemsToCreate.map((item: any) => 
        this.prisma.prescriptionItem.create({ data: item })
      ));
    }

    const full = await this.findOne(prescription.id);
    await this.notificationHelper.sendPrescriptionCreated(full, full.doctor.user, full.patient).catch((e) => this.logger.warn(`Notification failed: ${(e as Error).message}`));
    return full;
  }

  async update(id: number, dto: UpdatePrescriptionDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    const items = data.medications || [];
    if (data.medications && typeof data.medications !== 'string') {
      data.medications = JSON.stringify(data.medications);
    }
    const updated = await this.prisma.prescription.update({ where: { id }, data });
    
    if (Array.isArray(items)) {
      await this.prisma.prescriptionItem.deleteMany({ where: { prescriptionId: id } });
      const itemsToCreate = [];
      for (const item of items) {
        const medId = await this.resolveMedicationId(item);
        if (medId) {
          itemsToCreate.push({
            prescriptionId: id,
            medicationId: medId,
            dosage: item.dosage || '',
            frequency: item.frequency || '',
            duration: item.duration || '',
          });
        }
      }
      if (itemsToCreate.length > 0) {
        await Promise.all(itemsToCreate.map((item: any) => 
          this.prisma.prescriptionItem.create({ data: item })
        ));
      }
    }
    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.prescription.delete({ where: { id } });
  }
}