import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from '../prisma/tenant-context';
import * as fs from 'fs';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(user: { id: number; role: string; clinicId: number | null }) {
    if (user.role === 'PATIENT') {
      const patient = await tenantStorage.run({ clinicId: null }, async () => {
        return await this.prisma.patient.findFirst({ where: { userId: user.id } });
      });
      if (!patient) return [];

      return this.prisma.fileUpload.findMany({
        where: { patientId: patient.id },
        orderBy: { uploadedAt: 'desc' },
        include: { patient: { select: { id: true, firstName: true, lastName: true } } },
      });
    }

    const store = tenantStorage.getStore();
    return this.prisma.fileUpload.findMany({
      where: { clinicId: store?.clinicId ?? 0 },
      orderBy: { uploadedAt: 'desc' },
      include: { patient: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async findOne(id: number, user: { id: number; role: string; clinicId: number | null }) {
    if (user.role === 'PATIENT') {
      const patient = await tenantStorage.run({ clinicId: null }, async () => {
        return await this.prisma.patient.findFirst({ where: { userId: user.id } });
      });
      if (!patient) throw new NotFoundException('Patient record not found');

      const record = await this.prisma.fileUpload.findFirst({
        where: { id, patientId: patient.id },
      });
      if (!record) throw new NotFoundException(`File #${id} not found`);
      return record;
    }

    const store = tenantStorage.getStore();
    const record = await this.prisma.fileUpload.findFirst({
      where: { id, clinicId: store?.clinicId ?? 0 },
    });
    if (!record) throw new NotFoundException(`File #${id} not found`);
    return record;
  }

  async upload(
    file: Express.Multer.File,
    user: { id: number; role: string; clinicId: number | null },
    patientId?: number,
    notes?: string,
    category?: string,
  ) {
    let targetPatientId = patientId;
    let targetClinicId = user.clinicId;

    if (user.role === 'PATIENT') {
      const patient = await tenantStorage.run({ clinicId: null }, async () => {
        return await this.prisma.patient.findFirst({ where: { userId: user.id } });
      });
      if (!patient) throw new ForbiddenException('أنت غير مسجل كمريض في هذا النظام');

      if (patientId && patientId !== patient.id) {
        throw new ForbiddenException('غير مسموح لك برفع ملفات لمريض آخر');
      }
      targetPatientId = patient.id;

      // Associate with the clinic the patient is registered to if any (default to first active linked clinic)
      const linkedClinic = await tenantStorage.run({ clinicId: null }, async () => {
        return await this.prisma.clinicPatient.findFirst({ where: { patientId: patient.id } });
      });
      targetClinicId = linkedClinic ? linkedClinic.clinicId : 0;
    } else {
      const store = tenantStorage.getStore();
      targetClinicId = store?.clinicId ?? 0;
    }

    return this.prisma.fileUpload.create({
      data: {
        fileName: file.filename,
        fileType: file.mimetype,
        url: file.path,
        uploadedBy: user.id,
        clinicId: targetClinicId ?? 0,
        patientId: targetPatientId || null,
        notes: notes || null,
        category: category || null,
      },
    });
  }

  async remove(id: number, user: { id: number; role: string; clinicId: number | null }) {
    const record = await this.findOne(id, user);

    try {
      await fs.promises.unlink(record.url);
    } catch (e) {
      this.logger.warn(`Failed to delete file from disk: ${record.url} - ${(e as Error).message}`);
    }

    return this.prisma.fileUpload.delete({ where: { id } });
  }
}

