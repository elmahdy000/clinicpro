import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
      select: { id: true, email: true, name: true, role: true, clinicId: true, createdAt: true, updatedAt: true },
    });

    // Automatic doctor profile creation
    if (user.role === 'DOCTOR' && user.clinicId) {
      await this.prisma.doctor.create({
        data: {
          userId: user.id,
          clinicId: user.clinicId,
          specialization: dto.specialization || 'General Medicine',
          consultationFee: 100,
          status: 'ACTIVE',
        }
      });
    }

    return user;
  }

  async findAll(query: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true, role: true, clinicId: true, createdAt: true, updatedAt: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, clinicId: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: number, dto: UpdateUserDto) {
    const originalUser = await this.findOne(id);
    const updateData: any = { ...dto };
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, clinicId: true, createdAt: true, updatedAt: true },
    });

    // Update doctor profile dynamically based on role updates
    if (dto.role) {
      if (dto.role === 'DOCTOR' && user.clinicId) {
        const existingDoc = await this.prisma.doctor.findUnique({ where: { userId: user.id } });
        if (!existingDoc) {
          await this.prisma.doctor.create({
            data: {
              userId: user.id,
              clinicId: user.clinicId,
              specialization: (dto as any).specialization || 'General Medicine',
              consultationFee: 100,
              status: 'ACTIVE',
            }
          });
        }
      } else if (dto.role !== 'DOCTOR') {
        const existingDoc = await this.prisma.doctor.findUnique({ where: { userId: user.id } });
        if (existingDoc) {
          await this.prisma.doctor.delete({ where: { userId: user.id } });
        }
      }
    }

    return user;
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    // Delete doctor profile first to avoid foreign key issues
    const existingDoc = await this.prisma.doctor.findUnique({ where: { userId: user.id } });
    if (existingDoc) {
      await this.prisma.doctor.delete({ where: { userId: user.id } });
    }
    return this.prisma.user.delete({ where: { id } });
  }
}
