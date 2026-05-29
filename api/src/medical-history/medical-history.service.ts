import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type HistoryOptions = {
  clinicIds?: number[];
  includeDoctorNotes?: boolean;
};

@Injectable()
export class MedicalHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDurationDays(duration?: string | null): number {
    if (!duration) return 30;
    const normalized = duration.toLowerCase();
    const num = parseInt((normalized.match(/\d+/)?.[0] || '30'), 10);
    if (Number.isNaN(num)) return 30;
    if (normalized.includes('month') || normalized.includes('شهر')) return num * 30;
    if (normalized.includes('week') || normalized.includes('أسبوع')) return num * 7;
    return num;
  }

  private safeJson<T = any>(value?: string | null, fallback: T = {} as T): T {
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private extractHistoryBuckets(medicalHistory?: string | null) {
    if (!medicalHistory) {
      return { chronicDiseases: [], surgeries: '', familyHistory: '', importantNotes: '' };
    }
    const text = medicalHistory.trim();
    const chronic = text
      .split('|')
      .map((s) => s.trim())
      .find((s) => /الأمراض المزمنة|chronic diseases/i.test(s));
    const surgeries = text
      .split('|')
      .map((s) => s.trim())
      .find((s) => /العمليات السابقة|surgeries/i.test(s));
    const family = text
      .split('|')
      .map((s) => s.trim())
      .find((s) => /التاريخ العائلي|family history/i.test(s));

    const chronicDiseases = chronic
      ? chronic.split(':').slice(1).join(':').split(/[،,]/).map((x) => x.trim()).filter(Boolean)
      : [];

    return {
      chronicDiseases,
      surgeries: surgeries ? surgeries.split(':').slice(1).join(':').trim() : '',
      familyHistory: family ? family.split(':').slice(1).join(':').trim() : '',
      importantNotes: text,
    };
  }

  async getUnifiedMedicalHistory(patientId: number, options?: HistoryOptions) {
    const clinicFilter = options?.clinicIds?.length ? { clinicId: { in: options.clinicIds } } : {};
    const includeDoctorNotes = Boolean(options?.includeDoctorNotes);

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        governorateRel: { select: { id: true, nameAr: true, nameEn: true } },
        cityRel: { select: { id: true, nameAr: true, nameEn: true } },
        clinics: { include: { clinic: { select: { id: true, name: true, phone: true, address: true } } } },
      },
    });
    if (!patient) return null;

    const [appointments, visits, prescriptions, files] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { patientId, ...clinicFilter },
        include: { doctor: { include: { user: { select: { id: true, name: true } } } }, clinic: true },
        orderBy: { appointmentDate: 'desc' },
      }),
      this.prisma.medicalRecord.findMany({
        where: { patientId, ...clinicFilter },
        include: { doctor: { include: { user: { select: { id: true, name: true } } } }, clinic: true, appointment: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prescription.findMany({
        where: { patientId, ...clinicFilter },
        include: {
          doctor: { include: { user: { select: { id: true, name: true } } } },
          clinic: true,
          items: { include: { medication: true } },
        },
        orderBy: { prescribedDate: 'desc' },
      }),
      this.prisma.patientMedicalFile.findMany({
        where: { 
          patientId, 
          ...(options?.clinicIds?.length ? { 
            OR: [
              { clinicId: { in: options.clinicIds } },
              { clinicId: null }
            ]
          } : {}) 
        },
        include: { clinic: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const historyBuckets = this.extractHistoryBuckets(patient.medicalHistory);
    const now = new Date();
    const meds: any[] = [];
    prescriptions.forEach((rx) => {
      rx.items.forEach((item) => {
        const days = this.parseDurationDays(item.duration);
        const end = new Date(rx.prescribedDate);
        end.setDate(end.getDate() + days);
        meds.push({
          name: item.medication?.name || '',
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          prescribedDate: rx.prescribedDate,
          endsAt: end,
          doctor: rx.doctor?.user?.name || '',
          clinic: rx.clinic?.name || '',
          prescriptionId: rx.id,
        });
      });
    });

    const currentMedications = meds.filter((m) => m.endsAt >= now);
    const previousMedications = meds.filter((m) => m.endsAt < now);

    const timeline = [
      ...appointments.map((a) => ({
        type: 'APPOINTMENT',
        date: a.appointmentDate,
        title: 'موعد',
        clinic: a.clinic?.name || '',
        doctor: a.doctor?.user?.name || '',
        payload: { id: a.id, status: a.status, reason: a.reason || '' },
      })),
      ...visits.map((v) => ({
        type: 'VISIT',
        date: v.createdAt,
        title: 'زيارة / كشف',
        clinic: v.clinic?.name || '',
        doctor: v.doctor?.user?.name || '',
        payload: {
          id: v.id,
          diagnosis: v.diagnosis,
          vitals: this.safeJson(v.vitalSigns, {}),
          notes: includeDoctorNotes ? v.notes || '' : undefined,
        },
      })),
      ...prescriptions.map((p) => ({
        type: 'PRESCRIPTION',
        date: p.prescribedDate,
        title: 'روشتة',
        clinic: p.clinic?.name || '',
        doctor: p.doctor?.user?.name || '',
        payload: {
          id: p.id,
          medicinesCount: p.items.length,
          items: p.items.map((i) => ({
            name: i.medication?.name || '',
            dosage: i.dosage,
            frequency: i.frequency,
            duration: i.duration,
          })),
        },
      })),
      ...files.map((f) => {
        const category = (f.category || '').toLowerCase();
        const inferred =
          category.includes('lab') || category.includes('تحاليل')
            ? 'LAB_REPORT'
            : category.includes('radio') || category.includes('xray') || category.includes('أشعة')
            ? 'RADIOLOGY_SCAN'
            : f.fileType.includes('image/')
            ? 'MEDICAL_IMAGE'
            : 'MEDICAL_FILE';
        return {
          type: inferred,
          date: f.createdAt,
          title: f.title || 'ملف طبي مرفوع',
          clinic: f.clinic?.name || '',
          doctor: '',
          payload: {
            id: f.id,
            fileType: f.fileType,
            fileName: f.title,
            notes: f.notes || '',
            category: f.category || '',
            submittedBy: f.uploadedByType === 'PATIENT' ? 'PATIENT' : 'CLINIC',
            verificationStatus: f.verificationStatus,
          },
        };
      }),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((e) => ({ ...e, date: new Date(e.date).toISOString() }));

    const recentDiagnoses = visits.slice(0, 10).map((v) => ({
      date: v.createdAt.toISOString(),
      diagnosis: v.diagnosis,
      clinic: v.clinic?.name || '',
      doctor: v.doctor?.user?.name || '',
    }));

    const importantLabs = files
      .filter((f) => /lab|تحاليل/i.test(f.category || ''))
      .slice(0, 10)
      .map((f) => ({ id: f.id, date: f.createdAt.toISOString(), fileName: f.title, notes: f.notes || '' }));

    const importantRadiology = files
      .filter((f) => /radio|xray|scan|أشعة/i.test(f.category || '') || f.fileType.startsWith('image/'))
      .slice(0, 10)
      .map((f) => ({ id: f.id, date: f.createdAt.toISOString(), fileName: f.title, notes: f.notes || '' }));

    return {
      patient: {
        id: patient.id,
        fullName: `${patient.firstName} ${patient.lastName}`.trim(),
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone || '',
        email: patient.email || '',
        code: `P-${patient.id.toString().padStart(4, '0')}`,
        nationalId: patient.nationalId || '',
        dateOfBirth: patient.dateOfBirth?.toISOString() || null,
        gender: patient.gender || '',
        address: patient.address || '',
        governorate: patient.governorate || patient.governorateRel?.nameAr || '',
        city: patient.city || patient.cityRel?.nameAr || '',
        bloodGroup: patient.bloodGroup || '',
        emergencyContact: patient.emergencyContact || '',
      },
      structuredProfile: {
        allergies: patient.allergies || '',
        chronicDiseases: historyBuckets.chronicDiseases,
        surgeries: historyBuckets.surgeries,
        familyHistory: historyBuckets.familyHistory,
        importantMedicalNotes: historyBuckets.importantNotes,
        currentMedications,
        previousMedications,
        recentDiagnoses,
        importantLabs,
        importantRadiology,
        latestPrescriptions: prescriptions.slice(0, 10).map((p) => ({
          id: p.id,
          date: p.prescribedDate.toISOString(),
          clinic: p.clinic?.name || '',
          doctor: p.doctor?.user?.name || '',
          medicinesCount: p.items.length,
        })),
      },
      counts: {
        appointments: appointments.length,
        visits: visits.length,
        prescriptions: prescriptions.length,
        medicines: meds.length,
        files: files.length,
      },
      timeline,
      clinics: patient.clinics.map((cp) => ({
        id: cp.clinic.id,
        name: cp.clinic.name,
        phone: cp.clinic.phone || '',
        address: cp.clinic.address || '',
      })),
      generatedAt: new Date().toISOString(),
    };
  }
}

