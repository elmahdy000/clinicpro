import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from '../prisma/tenant-context';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { SubstituteMedicineDto } from './dto/substitute-medicine.dto';
import { NotificationHelperService } from '../common/services/notification-helper.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationHelper: NotificationHelperService,
    private redis: RedisService,
  ) {}

  async findAll(query: PaginationDto, doctorUserId?: number): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const store = tenantStorage.getStore();
    const where: any = { clinicId: store?.clinicId ?? 0 };
    if (doctorUserId) {
      const doctor = await this.prisma.doctor.findFirst({
        where: { userId: doctorUserId, clinicId: store?.clinicId ?? 0 },
        select: { id: true },
      });
      // If the user has no doctor profile, return no rows rather than all rows.
      where.doctorId = doctor?.id ?? -1;
    }
    if (search) {
      const isNumeric = !isNaN(Number(search)) && search.trim() !== '';
      where.OR = [
        { instructions: { contains: search } },
        isNumeric ? { id: Number(search) } : null,
        { patient: { firstName: { contains: search } } },
        { patient: { lastName: { contains: search } } },
        { patient: { phone: { contains: search } } },
      ].filter(Boolean);
    }
    const selectUser = { id: true, email: true, name: true, role: true };
    const include = {
      patient: true,
      doctor: { include: { user: { select: selectUser } } },
      medicalRecord: true,
      items: { include: { medication: true } },
    };
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
        items: { include: { medication: true } },
      },
    });
    if (!prescription) throw new NotFoundException(`Prescription #${id} not found`);
    if (typeof prescription.medications === 'string') {
      try { prescription.medications = JSON.parse(prescription.medications); } catch {}
    }

    if (prescription.branchId && prescription.clinicId) {
      const settings = await this.prisma.clinicSettings.findUnique({
        where: { clinicId: prescription.clinicId }
      });
      if (settings?.branches) {
        try {
          const branches = typeof settings.branches === 'string' ? JSON.parse(settings.branches) : settings.branches;
          const branch = branches.find((b: any) => b.id === prescription.branchId);
          if (branch) {
            if (branch.address) prescription.clinic.address = branch.address;
            if (branch.phone) prescription.clinic.phone = branch.phone;
          }
        } catch {}
      }
    }

    return prescription;
  }

  private async resolveMedicationId(item: any, clinicId: number): Promise<number | null> {
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
            clinicId,
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

  private parseQuantityFromItem(item: any): number {
    // Try to extract a numeric quantity from the item. Fall back to 1.
    // Example: item.quantity = 30, or item.dosage = "2 tablets"
    if (item && item.quantity != null && !isNaN(Number(item.quantity))) {
      return Math.max(1, Math.floor(Number(item.quantity)));
    }
    return 1;
  }

  /**
   * Whitelist the fields a caller is allowed to write on a prescription.
   * Never spread the raw DTO: that would let a caller inject clinicId,
   * or (on update) reassign the prescription to another patient/doctor.
   */
  private buildWritableData(dto: any, opts: { isCreate: boolean }): any {
    const data: any = {};
    if (dto.medications !== undefined) {
      data.medications =
        typeof dto.medications === 'string' ? dto.medications : JSON.stringify(dto.medications);
    }
    if (dto.instructions !== undefined) data.instructions = dto.instructions;
    if (dto.prescribedDate !== undefined) data.prescribedDate = dto.prescribedDate;
    if (dto.branchId !== undefined) data.branchId = dto.branchId;
    if (dto.branchName !== undefined) data.branchName = dto.branchName;
    if (dto.medicalRecordId !== undefined) data.medicalRecordId = dto.medicalRecordId;
    // patientId / doctorId may only be set at creation time, never reassigned on update.
    if (opts.isCreate) {
      if (dto.patientId !== undefined) data.patientId = dto.patientId;
      if (dto.doctorId !== undefined) data.doctorId = dto.doctorId;
    }
    return data;
  }

  private async decrementStock(
    tx: Prisma.TransactionClient,
    medicationId: number,
    clinicId: number,
    quantity: number = 1,
  ) {
    try {
      const stock = await tx.medicationStock.findFirst({
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
        await tx.medicationStock.update({
          where: { id: stock.id },
          data: { quantityOnHand: stock.quantityOnHand - quantity },
        });
        await tx.stockMovement.create({
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

  private async incrementStock(
    tx: Prisma.TransactionClient,
    medicationId: number,
    clinicId: number,
    quantity: number = 1,
  ) {
    try {
      const stock = await tx.medicationStock.findFirst({
        where: { medicationId, clinicId },
        orderBy: { expiryDate: 'asc' },
      });
      if (stock) {
        await tx.medicationStock.update({
          where: { id: stock.id },
          data: { quantityOnHand: stock.quantityOnHand + quantity },
        });
        await tx.stockMovement.create({
          data: {
            medicationStockId: stock.id,
            type: 'IN',
            quantity,
            referenceType: 'prescription_reversal',
            notes: `Auto-credited ${quantity} unit(s) on prescription update/delete`,
            performedBy: 0,
          },
        });
      }
    } catch (e) {
      this.logger.warn(`Failed to increment stock for medication #${medicationId}: ${(e as Error).message}`);
    }
  }

  async create(dto: CreatePrescriptionDto) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? 0;
    // Whitelist writable fields; clinicId comes from the tenant context, never the DTO.
    const data = this.buildWritableData(dto, { isCreate: true });
    const items = Array.isArray(dto.medications) ? dto.medications : [];
    const prescription = await this.prisma.prescription.create({ data: { ...data, clinicId } });

    const itemsToCreate = [];
    if (Array.isArray(items)) {
      for (const item of items) {
        const medId = await this.resolveMedicationId(item, clinicId);
        if (medId) {
          itemsToCreate.push({
            prescriptionId: prescription.id,
            medicationId: medId,
            dosage: item.dosage || '',
            frequency: item.frequency || '',
            duration: item.duration || '',
            instructions: item.instructions || null,
            quantity: this.parseQuantityFromItem(item),
          });
        }
      }
    }

    if (itemsToCreate.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const item of itemsToCreate) {
          await tx.prescriptionItem.create({
            data: {
              prescriptionId: item.prescriptionId,
              medicationId: item.medicationId,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions,
            },
          });
          await this.decrementStock(tx, item.medicationId, clinicId, item.quantity);
          await tx.doctorMedicine.updateMany({
            where: { clinicId, medicineId: item.medicationId },
            data: { usageCount: { increment: 1 } },
          });
        }
      });
    }

    if (dto.substitutions && Array.isArray(dto.substitutions) && dto.substitutions.length > 0) {
      for (const sub of dto.substitutions) {
        await this.prisma.drugSubstitutionLog.create({
          data: {
            clinicId,
            patientId: prescription.patientId,
            prescriptionId: prescription.id,
            doctorId: prescription.doctorId,
            originalMedicineId: sub.originalMedicineId || null,
            originalMedicineName: sub.originalMedicineName || 'Unknown',
            alternativeMedicineId: sub.alternativeMedicineId || null,
            alternativeMedicineName: sub.alternativeMedicineName || 'Unknown',
            reason: sub.reason || 'No reason provided',
            doctorNotes: sub.doctorNotes || null,
            safetyWarningsShown: sub.safetyWarningsShown ? JSON.stringify(sub.safetyWarningsShown) : null,
          }
        });

        await this.prisma.patientMedicalTimelineEvent.create({
          data: {
            patientId: prescription.patientId,
            clinicId,
            type: 'DRUG_SUBSTITUTION',
            title: 'استبدال دوائي أثناء إنشاء الروشتة',
            description: `تم استبدال "${sub.originalMedicineName}" بـ "${sub.alternativeMedicineName}". السبب: ${sub.reason}`,
            source: 'CLINIC',
            visibility: 'INTERNAL',
          }
        });
      }
    }

    const full = await this.findOne(prescription.id);
    await this.notificationHelper.sendPrescriptionCreated(full, full.doctor.user, full.patient).catch((e) => this.logger.warn(`Notification failed: ${(e as Error).message}`));
    await this.redis.delByPattern(`patients:timeline:*:${prescription.patientId}`);
    return full;
  }

  async update(id: number, dto: UpdatePrescriptionDto) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? 0;
    const existing = await this.findOne(id); // also enforces clinic scope
    // Whitelist writable fields; patientId/doctorId/clinicId can never be reassigned here.
    const data = this.buildWritableData(dto, { isCreate: false });
    const replaceItems = dto.medications !== undefined;
    const newItems = Array.isArray(dto.medications) ? dto.medications : [];

    // Build a medicationId -> original quantity map from the prescription's stored
    // medications JSON, so we credit back the SAME amount that was decremented.
    const oldQtyByMed = new Map<number, number>();
    const storedMeds = (existing as any).medications;
    if (Array.isArray(storedMeds)) {
      for (const m of storedMeds) {
        const medId = m?.medicationId;
        if (typeof medId === 'number') {
          oldQtyByMed.set(medId, this.parseQuantityFromItem(m));
        }
      }
    }

    // Resolve the new item medication ids up-front (may create medication rows) so the
    // transaction itself only touches stock + prescription rows and stays short.
    const resolvedNewItems: { medicationId: number; dosage: string; frequency: string; duration: string; instructions: string | null; quantity: number }[] = [];
    if (replaceItems) {
      for (const item of newItems) {
        const medId = await this.resolveMedicationId(item, clinicId);
        if (medId) {
          resolvedNewItems.push({
            medicationId: medId,
            dosage: item.dosage || '',
            frequency: item.frequency || '',
            duration: item.duration || '',
            instructions: item.instructions || null,
            quantity: this.parseQuantityFromItem(item),
          });
        }
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.prescription.update({ where: { id }, data });

      if (replaceItems) {
        const oldItems = await tx.prescriptionItem.findMany({ where: { prescriptionId: id } });
        // Credit back the original quantity for each replaced item.
        for (const oldItem of oldItems) {
          const qty = oldQtyByMed.get(oldItem.medicationId) ?? 1;
          await this.incrementStock(tx, oldItem.medicationId, clinicId, qty);
        }
        await tx.prescriptionItem.deleteMany({ where: { prescriptionId: id } });

        for (const item of resolvedNewItems) {
          await tx.prescriptionItem.create({
            data: {
              prescriptionId: id,
              medicationId: item.medicationId,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              instructions: item.instructions,
            },
          });
          await this.decrementStock(tx, item.medicationId, clinicId, item.quantity);
        }
      }
    });

    await this.redis.delByPattern(`patients:timeline:*:${existing.patientId}`);
    return this.findOne(id);
  }

  async substituteMedicine(prescriptionId: number, lineId: number, dto: SubstituteMedicineDto) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? 0;
    
    const prescription = await this.prisma.prescription.findFirst({
        where: { id: prescriptionId, clinicId }
    });
    if (!prescription) throw new NotFoundException('Prescription not found');

    const item = await this.prisma.prescriptionItem.findFirst({
        where: { id: lineId, prescriptionId }
    });
    if (!item) throw new NotFoundException('Prescription item not found');

    const originalMed = await this.prisma.medication.findUnique({ where: { id: item.medicationId } });
    const alternativeMed = await this.prisma.medication.findUnique({ where: { id: dto.alternativeMedicineId } });

    if (!originalMed || !alternativeMed) throw new NotFoundException('Medication not found');

    const log = await this.prisma.drugSubstitutionLog.create({
        data: {
            clinicId,
            patientId: prescription.patientId,
            prescriptionId,
            doctorId: prescription.doctorId,
            originalMedicineId: originalMed.id,
            originalMedicineName: originalMed.name,
            alternativeMedicineId: alternativeMed.id,
            alternativeMedicineName: alternativeMed.name,
            reason: dto.reason,
            doctorNotes: dto.doctorNotes,
            safetyWarningsShown: dto.safetyWarningsShown ? JSON.stringify(dto.safetyWarningsShown) : null,
        }
    });

    await this.prisma.prescriptionItem.update({
        where: { id: lineId },
        data: { medicationId: alternativeMed.id }
    });

    let newMedicationsJson = prescription.medications;
    if (newMedicationsJson) {
      try {
        const medsArray = typeof newMedicationsJson === 'string' ? JSON.parse(newMedicationsJson) : newMedicationsJson;
        if (Array.isArray(medsArray)) {
          // Find the corresponding item by comparing original names or just replace all matching the old name
          // Since we might not know the exact index in the JSON array, we update all that match the old name, or try to find by ID
          const updatedArray = medsArray.map((m: any) => {
            if ((m.medicationId && m.medicationId === originalMed.id) || (m.name && m.name === originalMed.name)) {
              return {
                ...m,
                medicationId: alternativeMed.id,
                name: alternativeMed.name
              };
            }
            return m;
          });
          newMedicationsJson = JSON.stringify(updatedArray);
          await this.prisma.prescription.update({
            where: { id: prescriptionId },
            data: { medications: newMedicationsJson }
          });
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }

    await this.prisma.patientMedicalTimelineEvent.create({
        data: {
            patientId: prescription.patientId,
            clinicId,
            type: 'DRUG_SUBSTITUTION',
            title: 'تم إجراء تحويل دوائي داخل الروشتة',
            description: `تم استبدال ${originalMed.name} بـ ${alternativeMed.name}. السبب: ${dto.reason}`,
            source: 'CLINIC',
            visibility: 'INTERNAL',
            date: new Date()
        }
    });

    await this.redis.delByPattern(`patients:timeline:*:${prescription.patientId}`);
    return { success: true, log };
  }

  async getSubstitutionLogs(prescriptionId: number) {
    const store = tenantStorage.getStore();
    return this.prisma.drugSubstitutionLog.findMany({
        where: { prescriptionId, clinicId: store?.clinicId ?? 0 },
        orderBy: { createdAt: 'desc' }
    });
  }

  async remove(id: number) {
    const old = await this.findOne(id);
    const result = await this.prisma.prescription.delete({ where: { id } });
    await this.redis.delByPattern(`patients:timeline:*:${old.patientId}`);
    return result;
  }
}