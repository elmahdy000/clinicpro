import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from '../prisma/tenant-context';

@Injectable()
export class MedicationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: string = '') {
    const where: any = query ? {
      OR: [
        { name: { contains: query } },
        { activeIngredient: { contains: query } },
        { category: { contains: query } },
      ],
    } : {};
    return this.prisma.medication.findMany({ where, take: 50, orderBy: { name: 'asc' } });
  }

  async findPaginated(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = query.search || '';
    const category = query.category || '';
    const form = query.form || '';
    const source = query.source || ''; // 'global' | 'clinic' | ''

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { activeIngredient: { contains: search } },
        { category: { contains: search } },
        { manufacturer: { contains: search } },
        { strength: { contains: search } },
      ];
    }
    if (category) where.category = category;
    if (form) where.form = form;
    if (source === 'global') where.isGlobal = true;
    if (source === 'clinic') where.isGlobal = false;

    const [data, total] = await Promise.all([
      this.prisma.medication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { prescriptionItems: true } } },
      }),
      this.prisma.medication.count({ where }),
    ]);

    // Also return distinct categories and forms for filter dropdowns
    const [categories, forms] = await Promise.all([
      this.prisma.medication.findMany({
        select: { category: true },
        where: { category: { not: null } },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      }),
      this.prisma.medication.findMany({
        select: { form: true },
        where: { form: { not: null } },
        distinct: ['form'],
        orderBy: { form: 'asc' },
      }),
    ]);

    return {
      data: data.map((m) => ({ ...m, usageCount: m._count.prescriptionItems })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      filters: {
        categories: categories.map((c) => c.category).filter(Boolean),
        forms: forms.map((f) => f.form).filter(Boolean),
      },
    };
  }

  async getAnalytics() {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? null;
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    // 1. Where clause for tenancy
    const rxItemWhere: any = clinicId ? { prescription: { clinicId } } : {};

    // 2. Fetch distinct prescription items grouping by medication
    const items = await this.prisma.prescriptionItem.findMany({
      where: rxItemWhere,
      include: {
        medication: true,
        prescription: {
          include: {
            patient: true,
            doctor: { include: { user: true } },
            clinic: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Overall stats
    const totalPrescriptions = items.length;

    // Helper to group items by Medication ID
    const medGroupMap = new Map<number, typeof items>();
    for (const item of items) {
      if (!medGroupMap.has(item.medicationId)) {
        medGroupMap.set(item.medicationId, []);
      }
      medGroupMap.get(item.medicationId)!.push(item);
    }

    // 4. Calculate top medications with details
    const medicationList = Array.from(medGroupMap.entries()).map(([medId, medItems]) => {
      const first = medItems[0];
      const medication = first.medication;

      // Demographics
      const genders: Record<string, number> = { MALE: 0, FEMALE: 0, UNKNOWN: 0 };
      const ageGroups: Record<string, number> = {
        '0-14 (أطفال)': 0,
        '15-29 (شباب)': 0,
        '30-59 (بالغين)': 0,
        '60+ (كبار سن)': 0,
        'غير محدد': 0,
      };

      // Top Doctors
      const docCountMap = new Map<number, { name: string; specialization: string; count: number }>();
      // Top Clinics
      const clinicCountMap = new Map<number, { name: string; count: number }>();
      // Monthly trend (last 6 months)
      const monthlyTrendMap = new Map<string, number>();

      for (const item of medItems) {
        const patient = item.prescription.patient;
        const doctor = item.prescription.doctor;
        const clinic = item.prescription.clinic;

        // Gender Grouping
        const gender = (patient.gender || 'UNKNOWN').toUpperCase();
        if (gender === 'MALE' || gender === 'M') genders.MALE++;
        else if (gender === 'FEMALE' || gender === 'F') genders.FEMALE++;
        else genders.UNKNOWN++;

        // Age Grouping
        if (patient.dateOfBirth) {
          const birth = new Date(patient.dateOfBirth);
          const age = now.getFullYear() - birth.getFullYear();
          if (age <= 14) ageGroups['0-14 (أطفال)']++;
          else if (age <= 29) ageGroups['15-29 (شباب)']++;
          else if (age <= 59) ageGroups['30-59 (بالغين)']++;
          else ageGroups['60+ (كبار سن)']++;
        } else {
          ageGroups['غير محدد']++;
        }

        // Doctor Grouping
        if (doctor) {
          const docId = doctor.id;
          const docName = doctor.user?.name || 'Unknown Doctor';
          const spec = doctor.specialization || 'General';
          if (!docCountMap.has(docId)) {
            docCountMap.set(docId, { name: docName, specialization: spec, count: 0 });
          }
          docCountMap.get(docId)!.count++;
        }

        // Clinic Grouping
        if (clinic) {
          const clId = clinic.id;
          const clName = clinic.name;
          if (!clinicCountMap.has(clId)) {
            clinicCountMap.set(clId, { name: clName, count: 0 });
          }
          clinicCountMap.get(clId)!.count++;
        }

        // Monthly trend key e.g. "2026-05"
        const date = new Date(item.prescription.prescribedDate);
        const monthKey = date.toISOString().slice(0, 7); // "YYYY-MM"
        monthlyTrendMap.set(monthKey, (monthlyTrendMap.get(monthKey) || 0) + 1);
      }

      // Convert maps to sorted arrays
      const topDoctors = Array.from(docCountMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      const topClinics = Array.from(clinicCountMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      const monthlyTrend = Array.from(monthlyTrendMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6);

      return {
        id: medication.id,
        name: medication.name,
        activeIngredient: medication.activeIngredient,
        category: medication.category || 'عام',
        form: medication.form || 'أقراص',
        strength: medication.strength || '',
        manufacturer: medication.manufacturer || 'مستورد',
        prescribedCount: medItems.length,
        demographics: { genders, ageGroups },
        topDoctors,
        topClinics,
        monthlyTrend,
      };
    }).sort((a, b) => b.prescribedCount - a.prescribedCount);

    // 5. Category Share Analysis
    const categoryCount: Record<string, number> = {};
    for (const item of items) {
      const cat = item.medication.category || 'عام';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }
    const categoryShare = Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
      percentage: totalPrescriptions ? Math.round((value / totalPrescriptions) * 100) : 0,
    })).sort((a, b) => b.value - a.value);

    // 6. Form Share Analysis
    const formCount: Record<string, number> = {};
    for (const item of items) {
      const form = item.medication.form || 'أقراص';
      formCount[form] = (formCount[form] || 0) + 1;
    }
    const formShare = Object.entries(formCount).map(([name, value]) => ({
      name,
      value,
      percentage: totalPrescriptions ? Math.round((value / totalPrescriptions) * 100) : 0,
    })).sort((a, b) => b.value - a.value);

    // 7. General market stats
    const totalMedications = await this.prisma.medication.count();
    const globalCount = await this.prisma.medication.count({ where: { isGlobal: true } });
    const clinicCount = await this.prisma.medication.count({ where: { isGlobal: false } });

    return {
      summary: {
        totalPrescribedItems: totalPrescriptions,
        uniqueMedsPrescribed: medicationList.length,
        totalMedsInDict: totalMedications,
        globalMedsCount: globalCount,
        clinicCustomCount: clinicCount,
      },
      categoryShare,
      formShare,
      topMedications: medicationList,
    };
  }

  async create(data: any) {
    const store = tenantStorage.getStore();
    // If created by clinic staff, mark as clinic-specific
    const isGlobal = data.isGlobal !== undefined ? data.isGlobal : !store?.clinicId;
    return this.prisma.medication.create({ data: { ...data, isGlobal } });
  }

  async update(id: number, data: any) {
    return this.prisma.medication.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.medication.delete({ where: { id } });
  }
}

