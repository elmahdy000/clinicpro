import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

const CACHE_TTL = 600; // 10 minutes

function cacheKey(query: PaginationDto): string {
  return `departments:list:${query.page || 1}:${query.limit || 10}:${query.search || ''}:${query.sortBy || 'id'}:${query.sortOrder || 'desc'}`;
}

@Injectable()
export class DepartmentsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResult<any>> {
    const key = cacheKey(query);
    const cached = await this.redis.get<PaginatedResult<any>>(key);
    if (cached) return cached;

    const { page = 1, limit = 10, search, sortBy = 'id', sortOrder = 'desc' } = query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.department.count({ where }),
    ]);
    const result: PaginatedResult<any> = { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    await this.redis.set(key, result, CACHE_TTL);
    return result;
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) throw new NotFoundException(`Department #${id} not found`);
    return department;
  }

  async create(dto: CreateDepartmentDto) {
    const dept = await this.prisma.department.create({ data: dto });
    await this.redis.delByPattern('departments:list:*');
    return dept;
  }

  async update(id: number, dto: UpdateDepartmentDto) {
    await this.findOne(id);
    const dept = await this.prisma.department.update({ where: { id }, data: dto });
    await this.redis.delByPattern('departments:list:*');
    return dept;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.department.delete({ where: { id } });
    await this.redis.delByPattern('departments:list:*');
  }
}
