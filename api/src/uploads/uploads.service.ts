import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from '../prisma/tenant-context';
import * as fs from 'fs';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    const store = tenantStorage.getStore();
    return this.prisma.fileUpload.findMany({
      where: { clinicId: store?.clinicId ?? 0 },
      orderBy: { uploadedAt: 'desc' },
      include: { patient: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async findOne(id: number) {
    const store = tenantStorage.getStore();
    const record = await this.prisma.fileUpload.findFirst({
      where: { id, clinicId: store?.clinicId ?? 0 },
    });
    if (!record) throw new NotFoundException(`File #${id} not found`);
    return record;
  }

  async upload(file: Express.Multer.File, uploadedBy: number, patientId?: number, notes?: string, category?: string) {
    const store = tenantStorage.getStore();
    return this.prisma.fileUpload.create({
      data: {
        fileName: file.filename,
        fileType: file.mimetype,
        url: file.path,
        uploadedBy,
        clinicId: store?.clinicId ?? 0,
        patientId: patientId || null,
        notes: notes || null,
        category: category || null,
      },
    });
  }

  async remove(id: number) {
    const store = tenantStorage.getStore();
    const record = await this.prisma.fileUpload.findFirst({
      where: { id, clinicId: store?.clinicId ?? 0 },
    });
    if (!record) throw new NotFoundException(`File #${id} not found`);

    try {
      await fs.promises.unlink(record.url);
    } catch (e) {
      this.logger.warn(`Failed to delete file from disk: ${record.url} - ${(e as Error).message}`);
    }

    return this.prisma.fileUpload.delete({ where: { id } });
  }
}
