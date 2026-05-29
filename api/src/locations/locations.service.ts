import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getGovernorates() {
    const data = await this.prisma.governorate.findMany({
      orderBy: { nameAr: 'asc' },
    });
    return { success: true, data };
  }

  async getCities(governorateId: string) {
    const data = await this.prisma.city.findMany({
      where: governorateId ? { governorateId } : {},
      orderBy: { nameAr: 'asc' },
    });
    return { success: true, data };
  }

  async getAll() {
    const data = await this.prisma.governorate.findMany({
      include: {
        cities: {
          orderBy: { nameAr: 'asc' },
        },
      },
      orderBy: { nameAr: 'asc' },
    });
    return { success: true, data };
  }
}
