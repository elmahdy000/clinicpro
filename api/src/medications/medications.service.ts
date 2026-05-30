import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tenantStorage } from '../prisma/tenant-context';

@Injectable()
export class MedicationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: string = '') {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? null;

    // Return global drugs + this clinic's custom drugs
    const where: any = {
      AND: [
        clinicId
          ? { OR: [{ isGlobal: true }, { clinicId }] }
          : { isGlobal: true },
        query ? {
          OR: [
            { name: { contains: query } },
            { activeIngredient: { contains: query } },
            { category: { contains: query } },
          ],
        } : {},
      ],
    };
    return this.prisma.medication.findMany({ where, take: 50, orderBy: { name: 'asc' } });
  }

  async findPaginated(query: any) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? null;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = query.search || '';
    const category = query.category || '';
    const form = query.form || '';
    const source = query.source || ''; // 'global' | 'clinic' | ''

    const tenantFilter = clinicId
      ? { OR: [{ isGlobal: true }, { clinicId }] }
      : { isGlobal: true };

    const where: any = { AND: [tenantFilter] };

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search } },
          { activeIngredient: { contains: search } },
          { category: { contains: search } },
          { manufacturer: { contains: search } },
          { strength: { contains: search } },
        ]
      });
    }
    if (category) where.AND.push({ category });
    if (form) where.AND.push({ form });
    if (source === 'global') where.AND.push({ isGlobal: true });
    if (source === 'clinic') where.AND.push({ isGlobal: false, clinicId: clinicId || 0 });

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

  async getAnalytics(governorateId?: string, cityId?: string, specialty?: string, medication?: string, period?: string) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? null;
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    // 1. Where clause for tenancy + optional filters
    const rxItemWhere: any = clinicId ? { prescription: { clinicId } } : {};
    if (medication) {
      rxItemWhere.medication = { name: { contains: medication } };
    }
    if (specialty && specialty !== 'all') {
      rxItemWhere.prescription = {
        ...(rxItemWhere.prescription || {}),
        doctor: { specialization: { contains: specialty } },
      };
    }
    if (governorateId || cityId) {
      const clinicFilter: any = {};
      if (governorateId) clinicFilter.governorateId = governorateId;
      if (cityId) clinicFilter.cityId = cityId;
      rxItemWhere.prescription = {
        ...(rxItemWhere.prescription || {}),
        clinic: clinicFilter,
      };
    }
    if (period && period !== 'all') {
      const since = new Date();
      if (period === 'thisMonth') {
        since.setDate(1);
        since.setHours(0, 0, 0, 0);
      } else if (period === 'thisQuarter') {
        const q = Math.floor(now.getMonth() / 3);
        since.setMonth(q * 3, 1);
        since.setHours(0, 0, 0, 0);
      } else if (period === 'thisYear') {
        since.setMonth(0, 1);
        since.setHours(0, 0, 0, 0);
      } else {
        const daysMap: Record<string, number> = { '7days': 7, '30days': 30, '90days': 90, '180days': 180, '365days': 365 };
        const days = daysMap[period] || 90;
        since.setDate(since.getDate() - days);
      }
      rxItemWhere.createdAt = { gte: since };
    }

    const items = await this.prisma.prescriptionItem.findMany({
      where: rxItemWhere,
      select: {
        id: true,
        medicationId: true,
        prescriptionId: true,
        medication: {
          select: {
            id: true,
            name: true,
            activeIngredient: true,
            category: true,
            form: true,
            strength: true,
            manufacturer: true,
          },
        },
        prescription: {
          select: {
            prescribedDate: true,
            clinicId: true,
            doctorId: true,
            patient: {
              select: {
                gender: true,
                dateOfBirth: true,
              },
            },
            doctor: {
              select: {
                id: true,
                specialization: true,
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Overall stats
    const totalPrescriptions = items.length;

    // Helper to group items by Medication ID
    const medGroupMap = new Map<number, typeof items>();
    const prescriptionMedsMap = new Map<number, string[]>();

    for (const item of items) {
      if (!medGroupMap.has(item.medicationId)) {
        medGroupMap.set(item.medicationId, []);
      }
      medGroupMap.get(item.medicationId)!.push(item);

      if (!prescriptionMedsMap.has(item.prescriptionId)) {
        prescriptionMedsMap.set(item.prescriptionId, []);
      }
      prescriptionMedsMap.get(item.prescriptionId)!.push(item.medication.name);
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

      // Co-prescriptions
      const coPrescriptionsMap = new Map<string, number>();
      for (const item of medItems) {
        const medsInRx = prescriptionMedsMap.get(item.prescriptionId) || [];
        for (const otherMed of medsInRx) {
          if (otherMed !== medication.name) {
            coPrescriptionsMap.set(otherMed, (coPrescriptionsMap.get(otherMed) || 0) + 1);
          }
        }
      }
      const coPrescriptions = Array.from(coPrescriptionsMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 co-prescribed drugs

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
        coPrescriptions,
      };
    }).sort((a, b) => b.prescribedCount - a.prescribedCount);

    // 5. Category Share Analysis
    const categoryCount: Record<string, number> = {};
    const categoryClinics: Record<string, Set<number>> = {};
    const categoryDoctors: Record<string, Set<number>> = {};
    for (const item of items) {
      const cat = item.medication.category || 'عام';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      if (!categoryClinics[cat]) categoryClinics[cat] = new Set();
      if (item.prescription.clinicId) categoryClinics[cat].add(item.prescription.clinicId);
      if (!categoryDoctors[cat]) categoryDoctors[cat] = new Set();
      if (item.prescription.doctorId) categoryDoctors[cat].add(item.prescription.doctorId);
    }
    const categoryShare = Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
      percentage: totalPrescriptions ? Math.round((value / totalPrescriptions) * 100) : 0,
      clinicsCount: categoryClinics[name].size,
      doctorsCount: categoryDoctors[name].size,
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

    // 6.5 Specialty vs Top Drug Correlation
    const specialtyMedsCount: Record<string, Record<string, number>> = {};
    const specialtyTotal: Record<string, number> = {};

    for (const item of items) {
      const spec = item.prescription.doctor?.specialization || 'عام';
      const drug = item.medication.name;
      if (!specialtyMedsCount[spec]) specialtyMedsCount[spec] = {};
      specialtyMedsCount[spec][drug] = (specialtyMedsCount[spec][drug] || 0) + 1;
      specialtyTotal[spec] = (specialtyTotal[spec] || 0) + 1;
    }

    const specialtyShare = Object.keys(specialtyMedsCount).map(spec => {
      // find top drug
      const drugCounts = specialtyMedsCount[spec];
      const topDrug = Object.keys(drugCounts).reduce((a, b) => drugCounts[a] > drugCounts[b] ? a : b);
      const total = specialtyTotal[spec];
      return {
        specialty: spec,
        drug: topDrug,
        percentage: total ? Math.round((drugCounts[topDrug] / total) * 100) : 0,
        total
      };
    }).sort((a, b) => b.total - a.total).slice(0, 5);

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
      specialtyShare,
      topMedications: medicationList,
    };
  }

  async getActiveIngredients(q?: string) {
    const where: any = { activeIngredient: { not: null } };
    if (q) {
      where.activeIngredient = { contains: q };
    }
    const results = await this.prisma.medication.findMany({
      where,
      select: { activeIngredient: true, therapeuticClass: true },
      distinct: ['activeIngredient'],
      orderBy: { activeIngredient: 'asc' },
      take: 20,
    });
    return results.map(r => ({
      name: r.activeIngredient,
      therapeuticClass: r.therapeuticClass,
    }));
  }

  async getManufacturers(q?: string) {
    const where: any = { manufacturer: { not: null } };
    if (q) {
      where.manufacturer = { contains: q };
    }
    const results = await this.prisma.medication.findMany({
      where,
      select: { manufacturer: true },
      distinct: ['manufacturer'],
      orderBy: { manufacturer: 'asc' },
      take: 20,
    });
    return results.map(r => r.manufacturer);
  }

  async create(data: any) {
    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? null;
    // If created by clinic staff: isGlobal=false, bind clinicId
    const isGlobal = data.isGlobal !== undefined ? data.isGlobal : !clinicId;
    const payload: any = { ...data, isGlobal };
    if (!isGlobal && clinicId) {
      payload.clinicId = clinicId;
    } else {
      // Global drugs never belong to a specific clinic
      delete payload.clinicId;
    }
    return this.prisma.medication.create({ data: payload });
  }

  async update(id: number, data: any) {
    const med = await this.prisma.medication.findUnique({ where: { id } });
    if (!med) throw new NotFoundException(`Medication #${id} not found`);
    const store = tenantStorage.getStore();
    if (store?.clinicId && med.isGlobal) {
      throw new ForbiddenException('Cannot edit global medications from a clinic context');
    }
    return this.prisma.medication.update({ where: { id }, data });
  }

  async remove(id: number) {
    const med = await this.prisma.medication.findUnique({ where: { id } });
    if (!med) throw new NotFoundException(`Medication #${id} not found`);
    const store = tenantStorage.getStore();
    if (store?.clinicId && med.isGlobal) {
      throw new ForbiddenException('Cannot delete global medications from a clinic context');
    }
    return this.prisma.medication.delete({ where: { id } });
  }

  async findAlternatives(id: number, patientId?: number, includeCheaper?: boolean) {
    const original = await this.prisma.medication.findUnique({ where: { id } });
    if (!original) throw new NotFoundException('Medicine not found');

    const store = tenantStorage.getStore();
    const clinicId = store?.clinicId ?? null;

    if (!original.activeIngredient && !original.therapeuticClass) {
        return {
            success: true,
            data: {
                originalMedicine: {
                    id: original.id,
                    tradeName: original.name,
                    activeIngredient: original.activeIngredient,
                    therapeuticClass: original.therapeuticClass,
                    isMarketShortage: original.isMarketShortage,
                    shortageNote: original.shortageNote,
                },
                patientSafetyContext: { allergies: [], chronicDiseases: [], currentMedications: [] },
                suggestions: []
            }
        };
    }

    // Scope: global alternatives + this clinic's custom alternatives
    const tenantFilter = clinicId
      ? { OR: [{ isGlobal: true }, { clinicId }] }
      : { isGlobal: true };

    const alternatives = await this.prisma.medication.findMany({
      where: {
        id: { not: id },
        AND: [
          tenantFilter,
          {
            OR: [
              ...(original.activeIngredient ? [{ activeIngredient: original.activeIngredient }] : []),
              ...(original.therapeuticClass ? [{ therapeuticClass: original.therapeuticClass }] : []),
            ]
          }
        ]
      }
    });

    // Fetch in-stock medication IDs for this clinic (quantity > 0)
    const inStockIds = new Set<number>();
    if (clinicId) {
      const stockRecords = await this.prisma.medicationStock.findMany({
        where: { clinicId, quantityOnHand: { gt: 0 } },
        select: { medicationId: true },
      });
      stockRecords.forEach(s => inStockIds.add(s.medicationId));
    }

    let allergies: string[] = [];
    let chronicDiseases: string[] = [];
    if (patientId) {
       const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
       allergies = patient?.allergies?.split(',').map(a => a.trim().toLowerCase()) || [];
       chronicDiseases = patient?.medicalHistory?.split(',').map(c => c.trim().toLowerCase()) || [];
    }

    // AI/Algorithmic boost based on historical operations
    const substitutionStats = await this.prisma.drugSubstitutionLog.groupBy({
      by: ['alternativeMedicineId'],
      where: { originalMedicineId: id, alternativeMedicineId: { not: null } },
      _count: { alternativeMedicineId: true },
      orderBy: { _count: { alternativeMedicineId: 'desc' } }
    });

    const historicalMap = new Map();
    let maxSubstitutions = 0;
    for (const stat of substitutionStats) {
      if (stat.alternativeMedicineId) {
        historicalMap.set(stat.alternativeMedicineId, stat._count.alternativeMedicineId);
        if (stat._count.alternativeMedicineId > maxSubstitutions) {
          maxSubstitutions = stat._count.alternativeMedicineId;
        }
      }
    }

    const suggestions = alternatives.map(alt => {
        let altType = 'SAME_THERAPEUTIC_CLASS';
        if (alt.activeIngredient === original.activeIngredient && alt.activeIngredient) {
            altType = 'SAME_ACTIVE_INGREDIENT';
        }
        if (includeCheaper && alt.price && original.price && alt.price < original.price && altType === 'SAME_ACTIVE_INGREDIENT') {
            altType = 'CHEAPER_OPTION';
        }
        
        let allergyConflict = false;
        if (allergies.length > 0 && alt.activeIngredient) {
            allergyConflict = allergies.some(a => alt.activeIngredient?.toLowerCase().includes(a));
        }

        let diseaseConflict = false;
        if (chronicDiseases.length > 0 && alt.contraindications) {
            diseaseConflict = chronicDiseases.some(d => alt.contraindications?.toLowerCase().includes(d));
        }

        const safetyLevel = allergyConflict || diseaseConflict ? 'NOT_RECOMMENDED' : (altType === 'SAME_THERAPEUTIC_CLASS' ? 'CAUTION' : 'SAFE');
        const historicalCount = historicalMap.get(alt.id) || 0;
        const isTopRecommendation = maxSubstitutions > 0 && historicalCount === maxSubstitutions && safetyLevel !== 'NOT_RECOMMENDED';

        const reasons = [altType === 'SAME_ACTIVE_INGREDIENT' ? 'نفس المادة الفعالة' : altType === 'CHEAPER_OPTION' ? 'بديل أرخص' : 'بديل بنفس الفئة العلاجية'];
        const isInClinicStock = inStockIds.has(alt.id);
        if (isTopRecommendation) {
            reasons.unshift('البديل الأكثر استخداماً');
        }
        if (isInClinicStock) {
            reasons.unshift('متوفر في مخزن العيادة');
        }

        return {
           medicineId: alt.id,
           tradeName: alt.name,
           activeIngredient: alt.activeIngredient,
           strength: alt.strength,
           dosageForm: alt.form,
           therapeuticClass: alt.therapeuticClass,
           price: alt.price,
           alternativeType: altType,
           safetyLevel,
           isTopRecommendation,
           isInClinicStock: inStockIds.has(alt.id),
           historicalScore: historicalCount,
           reasons,
           warnings: [
               allergyConflict ? 'تنبيه حساسية: المريض لديه حساسية من هذا المركب' : '',
               diseaseConflict ? 'تنبيه مرض مزمن: يتعارض مع التاريخ المرضي' : ''
           ].filter(Boolean),
           patientRiskFlags: {
               allergyConflict,
               chronicDiseaseConflict: diseaseConflict,
               interactionWarning: false,
               ageWarning: false,
               pregnancyWarning: !!alt.pregnancyWarning,
               lactationWarning: !!alt.lactationWarning,
           }
        };
    });

    return {
       success: true,
       data: {
          originalMedicine: {
            id: original.id,
            tradeName: original.name,
            activeIngredient: original.activeIngredient,
            therapeuticClass: original.therapeuticClass,
            isMarketShortage: original.isMarketShortage,
            shortageNote: original.shortageNote,
          },
          patientSafetyContext: {
             allergies,
             chronicDiseases,
             currentMedications: []
          },
          suggestions: suggestions.sort((a, b) => {
             // 1. Safety first — blocked drugs always last
             if (a.safetyLevel === 'NOT_RECOMMENDED' && b.safetyLevel !== 'NOT_RECOMMENDED') return 1;
             if (b.safetyLevel === 'NOT_RECOMMENDED' && a.safetyLevel !== 'NOT_RECOMMENDED') return -1;

             // 2. Clinic stock availability (prefer drugs already in clinic)
             if (a.isInClinicStock && !b.isInClinicStock) return -1;
             if (!a.isInClinicStock && b.isInClinicStock) return 1;

             // 3. ML / Historical ranking
             if (b.historicalScore !== a.historicalScore) {
                return b.historicalScore - a.historicalScore;
             }

             // 4. Clinical matching type
             if (a.alternativeType === 'SAME_ACTIVE_INGREDIENT' && b.alternativeType !== 'SAME_ACTIVE_INGREDIENT') return -1;
             if (a.alternativeType !== 'SAME_ACTIVE_INGREDIENT' && b.alternativeType === 'SAME_ACTIVE_INGREDIENT') return 1;

             return 0;
          })
       }
    };
  }

  async updateShortageStatus(id: number, isMarketShortage: boolean, shortageNote?: string) {
    return this.prisma.medication.update({
      where: { id },
      data: { isMarketShortage, shortageNote: shortageNote || null }
    });
  }

  async getMarketShortages() {
    const drugs = await this.prisma.medication.findMany({
      where: { isMarketShortage: true },
      select: {
        id: true, name: true, activeIngredient: true,
        therapeuticClass: true, shortageNote: true,
        _count: { select: { prescriptionItems: true } }
      },
      orderBy: { name: 'asc' }
    });

    // Enrich each shortage drug with its top historical alternative
    const result = await Promise.all(drugs.map(async (drug) => {
      const topAlt = await this.prisma.drugSubstitutionLog.groupBy({
        by: ['alternativeMedicineId', 'alternativeMedicineName'],
        where: { originalMedicineId: drug.id, alternativeMedicineId: { not: null } },
        _count: { alternativeMedicineId: true },
        orderBy: { _count: { alternativeMedicineId: 'desc' } },
        take: 1
      });

      return {
        ...drug,
        prescriptionCount: drug._count.prescriptionItems,
        topAlternative: topAlt[0] ? {
          id: topAlt[0].alternativeMedicineId,
          name: topAlt[0].alternativeMedicineName,
          usedCount: topAlt[0]._count.alternativeMedicineId
        } : null
      };
    }));

    return { success: true, data: result };
  }

  async getTopSubstitutionPairs(limit = 20) {
    const pairs = await this.prisma.drugSubstitutionLog.groupBy({
      by: ['originalMedicineName', 'alternativeMedicineName', 'originalMedicineId', 'alternativeMedicineId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit
    });

    return {
      success: true,
      data: pairs.map(p => ({
        original: { id: p.originalMedicineId, name: p.originalMedicineName },
        alternative: { id: p.alternativeMedicineId, name: p.alternativeMedicineName },
        substitutionCount: p._count.id,
      }))
    };
  }
}
