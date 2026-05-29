import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MyMedicinesService {
  constructor(private prisma: PrismaService) {}

  private async resolveDoctor(userId: number, clinicId: number, role: string) {
    if (role === 'CLINIC_ADMIN') return null;
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new ForbiddenException('Doctor profile not found');
    if (doctor.clinicId !== clinicId) throw new ForbiddenException('Doctor does not belong to this clinic');
    return doctor;
  }

  async findAll(userId: number, clinicId: number, role: string, query: { search?: string; favorite?: string; source?: string; page?: number; limit?: number }) {
    const doctor = await this.resolveDoctor(userId, clinicId, role);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const search = query.search || '';
    const favoriteOnly = query.favorite === 'true';

    const where: any = { clinicId };
    if (doctor) {
      where.doctorId = doctor.id;
    }

    if (search) {
      where.OR = [
        { tradeName: { contains: search } },
        { activeIngredient: { contains: search } },
        { therapeuticClass: { contains: search } },
      ];
    }

    if (favoriteOnly) {
      where.isFavorite = true;
    }

    if (query.source) {
      where.source = query.source;
    }

    const [data, total] = await Promise.all([
      this.prisma.doctorMedicine.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isFavorite: 'desc' }, { usageCount: 'desc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.doctorMedicine.count({ where }),
    ]);

    const stats = await this.getStats(doctor?.id || null, clinicId);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats,
    };
  }

  private async getStats(doctorId: number | null, clinicId: number) {
    const where: any = { clinicId };
    if (doctorId) where.doctorId = doctorId;

    const [total, favorites, manualCount, totalUsage] = await Promise.all([
      this.prisma.doctorMedicine.count({ where }),
      this.prisma.doctorMedicine.count({ where: { ...where, isFavorite: true } }),
      this.prisma.doctorMedicine.count({ where: { ...where, source: 'MANUAL' } }),
      this.prisma.doctorMedicine.aggregate({
        where,
        _sum: { usageCount: true },
      }),
    ]);

    return {
      total,
      favorites,
      manualCount,
      totalUsageCount: totalUsage._sum.usageCount || 0,
    };
  }

  async create(userId: number, clinicId: number, role: string, data: any) {
    const doctor = await this.resolveDoctor(userId, clinicId, role);
    if (!doctor) throw new ForbiddenException('Only doctors can add private medicines');

    const tradeName = (data.tradeName || '').trim();
    const strength = (data.strength || '').trim();

    const dup = await this.prisma.doctorMedicine.findFirst({
      where: {
        clinicId,
        doctorId: doctor.id,
        tradeName: { equals: tradeName },
        strength: strength ? { equals: strength } : undefined,
      },
    });
    if (dup) {
      throw new ConflictException('هذا الدواء موجود بالفعل في أدويتك الخاصة');
    }

    const source = data.source === 'FROM_GLOBAL_DICTIONARY' ? 'FROM_GLOBAL_DICTIONARY' : 'MANUAL';

    return this.prisma.doctorMedicine.create({
      data: {
        clinicId,
        doctorId: doctor.id,
        medicineId: data.medicineId ? +data.medicineId : null,
        tradeName,
        activeIngredient: data.activeIngredient || null,
        strength: strength || null,
        dosageForm: data.dosageForm || null,
        route: data.route || null,
        therapeuticClass: data.therapeuticClass || null,
        manufacturer: data.manufacturer || null,
        defaultDose: data.defaultDose || null,
        defaultFrequency: data.defaultFrequency || null,
        defaultDuration: data.defaultDuration || null,
        defaultInstructions: data.defaultInstructions || null,
        isFavorite: data.isFavorite === true,
        showInQuickSearch: data.showInQuickSearch !== false,
        source,
      },
    });
  }

  async update(userId: number, clinicId: number, role: string, id: number, data: any) {
    const doctor = await this.resolveDoctor(userId, clinicId, role);
    const where: any = { id, clinicId };
    if (doctor) where.doctorId = doctor.id;

    const med = await this.prisma.doctorMedicine.findFirst({ where });
    if (!med) throw new NotFoundException('Doctor medicine not found');

    return this.prisma.doctorMedicine.update({
      where: { id },
      data: {
        tradeName: data.tradeName,
        activeIngredient: data.activeIngredient,
        strength: data.strength,
        dosageForm: data.dosageForm,
        route: data.route,
        therapeuticClass: data.therapeuticClass,
        manufacturer: data.manufacturer,
        defaultDose: data.defaultDose,
        defaultFrequency: data.defaultFrequency,
        defaultDuration: data.defaultDuration,
        defaultInstructions: data.defaultInstructions,
        isFavorite: data.isFavorite !== undefined ? data.isFavorite === true : undefined,
        showInQuickSearch: data.showInQuickSearch !== undefined ? data.showInQuickSearch !== false : undefined,
      },
    });
  }

  async remove(userId: number, clinicId: number, role: string, id: number) {
    const doctor = await this.resolveDoctor(userId, clinicId, role);
    const where: any = { id, clinicId };
    if (doctor) where.doctorId = doctor.id;

    const med = await this.prisma.doctorMedicine.findFirst({ where });
    if (!med) throw new NotFoundException('Doctor medicine not found');

    return this.prisma.doctorMedicine.delete({ where: { id } });
  }

  async toggleFavorite(userId: number, clinicId: number, role: string, id: number) {
    const doctor = await this.resolveDoctor(userId, clinicId, role);
    if (!doctor) throw new ForbiddenException('Only doctors can manage favorites');

    const med = await this.prisma.doctorMedicine.findFirst({ where: { id, clinicId, doctorId: doctor.id } });
    if (!med) throw new NotFoundException('Doctor medicine not found');

    return this.prisma.doctorMedicine.update({
      where: { id },
      data: { isFavorite: !med.isFavorite },
    });
  }

  async search(userId: number, clinicId: number, role: string, q: string) {
    if (!q) return [];

    const doctor = await this.resolveDoctor(userId, clinicId, role);
    const where: any = { clinicId };
    if (doctor) where.doctorId = doctor.id;

    where.OR = [
      { tradeName: { contains: q } },
      { activeIngredient: { contains: q } },
    ];

    return this.prisma.doctorMedicine.findMany({
      where,
      take: 20,
      orderBy: [{ isFavorite: 'desc' }, { usageCount: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async importFromGlobal(userId: number, clinicId: number, role: string, medicineId: number) {
    const doctor = await this.resolveDoctor(userId, clinicId, role);
    if (!doctor) throw new ForbiddenException('Only doctors can import to their private list');

    const globalMed = await this.prisma.medication.findUnique({ where: { id: medicineId } });
    if (!globalMed) throw new NotFoundException('Global medicine not found');

    const existing = await this.prisma.doctorMedicine.findFirst({
      where: {
        clinicId,
        doctorId: doctor.id,
        medicineId,
      },
    });

    if (existing) {
      throw new ConflictException('هذا الدواء موجود بالفعل في أدويتك الخاصة');
    }

    return this.prisma.doctorMedicine.create({
      data: {
        clinicId,
        doctorId: doctor.id,
        medicineId: globalMed.id,
        tradeName: globalMed.name,
        activeIngredient: globalMed.activeIngredient || null,
        strength: globalMed.strength || null,
        dosageForm: globalMed.form || null,
        route: globalMed.route || null,
        therapeuticClass: globalMed.therapeuticClass || null,
        manufacturer: globalMed.manufacturer || null,
        source: 'FROM_GLOBAL_DICTIONARY',
      },
    });
  }
}
