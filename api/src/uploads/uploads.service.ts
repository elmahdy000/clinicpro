import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.fileUpload.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.fileUpload.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`File #${id} not found`);
    return record;
  }

  async upload(file: Express.Multer.File, uploadedBy: number) {
    return this.prisma.fileUpload.create({
      data: {
        fileName: file.filename,
        fileType: file.mimetype,
        url: file.path,
        uploadedBy,
        clinicId: 1,
      },
    });
  }

  async remove(id: number) {
    const record = await this.prisma.fileUpload.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`File #${id} not found`);

    try {
      fs.unlinkSync(record.url);
    } catch (e) {
      this.logger.warn(`Failed to delete file from disk: ${record.url} - ${(e as Error).message}`);
    }

    return this.prisma.fileUpload.delete({ where: { id } });
  }
}
