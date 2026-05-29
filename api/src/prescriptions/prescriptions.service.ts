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

    if (data.substitutions && Array.isArray(data.substitutions) && data.substitutions.length > 0) {
      for (const sub of data.substitutions) {
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

  async substituteMedicine(prescriptionId: number, lineId: number, dto: any) {
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

    // Also update the legacy JSON medications string if needed for backward compatibility
    try {
        if (prescription.medications && typeof prescription.medications === 'string') {
            const arr = JSON.parse(prescription.medications);
            let changed = false;
            arr.forEach((m: any) => {
                if (m.name === originalMed.name || m.medicationId === originalMed.id) {
                    m.name = alternativeMed.name;
                    m.medicationId = alternativeMed.id;
                    changed = true;
                }
            });
            if (changed) {
                await this.prisma.prescription.update({
                    where: { id: prescriptionId },
                    data: { medications: JSON.stringify(arr) }
                });
            }
        }
    } catch(e) {}

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
    await this.findOne(id);
    return this.prisma.prescription.delete({ where: { id } });
  }
}