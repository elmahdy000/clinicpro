import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabTestDto } from './dto/create-lab-test.dto';
import { UpdateLabTestDto } from './dto/update-lab-test.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class LabService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const where: any = {};
    if (search) {
      where.OR = [
        { testName: { contains: search } },
        { testType: { contains: search } },
        { status: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.labTest.findMany({
        where,
        include: { patient: true, doctor: { include: { user: { select: { id: true, email: true, name: true, role: true } } } }, appointment: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.labTest.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const labTest = await this.prisma.labTest.findUnique({
      where: { id },
      include: { patient: true, doctor: { include: { user: { select: { id: true, email: true, name: true, role: true } } } }, appointment: true },
    });
    if (!labTest) throw new NotFoundException(`LabTest #${id} not found`);
    return labTest;
  }

  async create(dto: CreateLabTestDto) {
    return this.prisma.labTest.create({
      data: dto,
      include: { patient: true, doctor: { include: { user: { select: { id: true, email: true, name: true, role: true } } } }, appointment: true },
    });
  }

  async update(id: number, dto: UpdateLabTestDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.status === 'COLLECTED') data.collectedDate = new Date();
    if (dto.status === 'COMPLETED') data.completedDate = new Date();
    return this.prisma.labTest.update({
      where: { id },
      data,
      include: { patient: true, doctor: { include: { user: { select: { id: true, email: true, name: true, role: true } } } }, appointment: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.labTest.delete({ where: { id } });
  }
}
