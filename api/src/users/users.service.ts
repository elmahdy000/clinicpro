import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from '../prisma/tenant-context';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './user-role.enum';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import * as bcrypt from 'bcrypt';

/** Roles a CLINIC_ADMIN is allowed to assign to staff within their own clinic. */
const CLINIC_ADMIN_ASSIGNABLE_ROLES: string[] = [
  UserRole.CLINIC_ADMIN,
  UserRole.DOCTOR,
  UserRole.NURSE,
  UserRole.RECEPTIONIST,
];

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private getClinicId(): number | undefined {
    return tenantStorage.getStore()?.clinicId ?? undefined;
  }

  /**
   * Validate that `caller` is allowed to assign `targetRole`. A CLINIC_ADMIN may only
   * assign clinic-level roles (never PLATFORM_OWNER / SUB_ADMIN); PLATFORM_OWNER is unrestricted.
   */
  private assertCanAssignRole(caller: { role?: string } | undefined, targetRole: string) {
    if (!targetRole) return;
    if (caller?.role === UserRole.PLATFORM_OWNER) return;
    if (!CLINIC_ADMIN_ASSIGNABLE_ROLES.includes(targetRole)) {
      throw new ForbiddenException('You are not allowed to assign this role');
    }
  }

  async create(dto: CreateUserDto, caller?: { id: number; role?: string; clinicId?: number | null }) {
    const clinicId = this.getClinicId();
    // A non-platform caller must operate inside a clinic context and may only create
    // clinic-scoped roles. Prevents privilege escalation to PLATFORM_OWNER/SUB_ADMIN.
    this.assertCanAssignRole(caller, dto.role);
    if (caller?.role !== UserRole.PLATFORM_OWNER && !clinicId) {
      throw new ForbiddenException('Missing clinic context');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      // Whitelist fields explicitly — never spread the raw DTO. clinicId is forced to the
      // tenant context (PLATFORM_OWNER creates platform-level users with clinicId=null).
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        password: hashedPassword,
        clinicId: caller?.role === UserRole.PLATFORM_OWNER ? undefined : clinicId,
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
    const clinicId = this.getClinicId();

    const where: any = {};
    // Scope to current clinic — PLATFORM_OWNER (clinicId=null) sees all
    if (clinicId) where.clinicId = clinicId;

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
    const clinicId = this.getClinicId();
    const where: any = { id };
    if (clinicId) where.clinicId = clinicId;

    const user = await this.prisma.user.findFirst({
      where,
      select: { id: true, email: true, name: true, role: true, clinicId: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: number, dto: UpdateUserDto, caller?: { id: number; role?: string; clinicId?: number | null }) {
    // Verify the user belongs to this clinic before updating
    await this.findOne(id);
    if (dto.role) this.assertCanAssignRole(caller, dto.role);

    // Whitelist updatable fields — never spread the raw DTO (blocks clinicId injection
    // and any other non-permitted columns).
    const updateData: any = {};
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.role !== undefined) updateData.role = dto.role;
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
