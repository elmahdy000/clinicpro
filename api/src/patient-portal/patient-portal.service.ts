import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MedicalHistoryService } from '../medical-history/medical-history.service';

@Injectable()
export class PatientPortalService {
  constructor(
    private prisma: PrismaService,
    private medicalHistory: MedicalHistoryService,
  ) {}

  private async getPortalAccess() {
    return {
      canRequestAppointment: true,
      canViewMedicalNotes: true,
      canDownloadPrescriptions: true,
      canViewFiles: true,
    };
  }

  private mapAppointmentStatus(status: string) {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'CONFIRMED' || normalized === 'SCHEDULED' || normalized === 'PENDING') return 'SCHEDULED';
    if (normalized === 'WAITING') return 'WAITING';
    if (normalized === 'COMPLETED') return 'COMPLETED';
    if (normalized === 'CANCELLED') return 'CANCELLED';
    return 'WAITING';
  }

  async getPatientFromUserId(userId: number) {
    const patient = await this.prisma.patient.findFirst({
      where: { userId },
      include: {
        clinics: {
          include: {
            clinic: { select: { id: true, name: true, address: true, phone: true, logoUrl: true } },
          },
        },
      },
    });
    if (!patient) throw new NotFoundException('Patient profile not found. Link your account at the clinic first.');
    return patient;
  }

  async getDashboard(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const clinicIds = patient.clinics.map((cp) => cp.clinicId);

    const [upcomingAppointments, recentPrescriptions, recentVisits, unreadNotifications] =
      await Promise.all([
        this.prisma.appointment.findMany({
          where: {
            patientId: patient.id,
            clinicId: { in: clinicIds },
            appointmentDate: { gte: new Date() },
            status: { in: ['CONFIRMED', 'PENDING'] },
          },
          take: 5,
          orderBy: { appointmentDate: 'asc' },
          include: {
            doctor: { select: { specialization: true, user: { select: { name: true } } } },
            clinic: { select: { name: true } },
          },
        }),
        this.prisma.prescription.findMany({
          where: { patientId: patient.id, clinicId: { in: clinicIds } },
          take: 5,
          orderBy: { prescribedDate: 'desc' },
          include: {
            doctor: { select: { specialization: true, user: { select: { name: true } } } },
            clinic: { select: { name: true } },
          },
        }),
        this.prisma.medicalRecord.findMany({
          where: { patientId: patient.id, clinicId: { in: clinicIds } },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: { select: { specialization: true, user: { select: { name: true } } } },
            clinic: { select: { name: true } },
          },
        }),
        this.prisma.notification.count({ where: { userId, isRead: false } }),
      ]);

    return {
      patient,
      clinics: patient.clinics.map((cp) => cp.clinic),
      upcomingAppointments,
      recentPrescriptions,
      recentVisits,
      unreadNotifications,
    };
  }

  async getMe(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const fullName = `${patient.firstName} ${patient.lastName}`.trim();
    return {
      id: patient.id,
      fullName,
      phone: patient.phone || '',
      code: `P-${patient.id}`,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
    };
  }

  async getOverview(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const now = new Date();
    const portalAccess = await this.getPortalAccess();

    const [upcomingAppointments, availablePrescriptions, previousVisits, unreadNotifications] = await Promise.all([
      this.prisma.appointment.count({
        where: { patientId: patient.id, appointmentDate: { gte: now }, status: { not: 'CANCELLED' } },
      }),
      this.prisma.prescription.count({
        where: { patientId: patient.id },
      }),
      this.prisma.medicalRecord.count({
        where: { patientId: patient.id },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      patient: {
        id: String(patient.id),
        fullName: `${patient.firstName} ${patient.lastName}`.trim(),
        phone: patient.phone || '',
        code: `P-${patient.id}`,
      },
      counts: {
        upcomingAppointments,
        availablePrescriptions,
        previousVisits,
        unreadNotifications,
      },
      clinicAccess: portalAccess,
    };
  }

  async getDashboardAppointments(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const rows = await this.prisma.appointment.findMany({
      where: { patientId: patient.id },
      orderBy: { appointmentDate: 'asc' },
      take: 10,
      include: {
        doctor: { select: { user: { select: { name: true } } } },
        clinic: { select: { name: true } },
      },
    });

    return rows.map((row) => ({
      id: String(row.id),
      date: row.appointmentDate.toISOString(),
      time: row.appointmentDate.toISOString(),
      clinicName: row.clinic?.name || '',
      doctorName: row.doctor?.user?.name || '',
      status: this.mapAppointmentStatus(row.status),
      reason: row.reason || undefined,
    }));
  }

  async getDashboardPrescriptions(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const portalAccess = await this.getPortalAccess();
    const rows = await this.prisma.prescription.findMany({
      where: { patientId: patient.id },
      orderBy: { prescribedDate: 'desc' },
      take: 10,
      include: {
        doctor: { select: { user: { select: { name: true } } } },
        clinic: { select: { name: true } },
        items: { select: { id: true } },
      },
    });

    return rows.map((row) => ({
      id: String(row.id),
      date: row.prescribedDate.toISOString(),
      clinicName: row.clinic?.name || '',
      doctorName: row.doctor?.user?.name || '',
      medicinesCount: row.items.length,
      canDownloadPdf: portalAccess.canDownloadPrescriptions,
    }));
  }

  async getDashboardVisits(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const portalAccess = await this.getPortalAccess();
    const rows = await this.prisma.medicalRecord.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        doctor: { select: { user: { select: { name: true } } } },
        clinic: { select: { name: true } },
      },
    });

    return rows.map((row) => ({
      id: String(row.id),
      date: row.createdAt.toISOString(),
      clinicName: row.clinic?.name || '',
      doctorName: row.doctor?.user?.name || '',
      diagnosisPreview: portalAccess.canViewMedicalNotes ? row.diagnosis : undefined,
      isVisibleToPatient: portalAccess.canViewMedicalNotes,
    }));
  }

  async getDashboardNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        createdAt: true,
        isRead: true,
      },
    });
  }

  async getDashboardClinics(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const rows = await this.prisma.clinicPatient.findMany({
      where: { patientId: patient.id },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: String(row.clinic.id),
      name: row.clinic.name,
      phone: row.clinic.phone || '',
      address: row.clinic.address || '',
      lastVisitDate: null,
    }));
  }

  async getAppointments(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const clinicIds = patient.clinics.map((cp) => cp.clinicId);
    return this.prisma.appointment.findMany({
      where: { patientId: patient.id, clinicId: { in: clinicIds } },
      orderBy: { appointmentDate: 'desc' },
      take: 100,
      include: {
        doctor: { select: { specialization: true, user: { select: { name: true } } } },
        clinic: { select: { name: true, address: true, phone: true } },
      },
    });
  }

  async getPrescriptions(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const clinicIds = patient.clinics.map((cp) => cp.clinicId);
    const prescriptions = await this.prisma.prescription.findMany({
      where: { patientId: patient.id, clinicId: { in: clinicIds } },
      orderBy: { prescribedDate: 'desc' },
      include: {
        doctor: { select: { specialization: true, user: { select: { name: true } } } },
        clinic: { select: { name: true, logoUrl: true } },
        medicalRecord: { select: { diagnosis: true } },
        items: {
          include: { medication: { select: { name: true, category: true, strength: true } } },
        },
      },
    });
    return prescriptions.map((rx) => {
      let parsedMeds: any = rx.medications;
      if (parsedMeds === null || parsedMeds === undefined) {
        parsedMeds = [];
      } else if (typeof parsedMeds === 'string') {
        try { parsedMeds = JSON.parse(parsedMeds); } catch { parsedMeds = []; }
      }
      return { ...rx, medications: parsedMeds };
    });
  }

  async getMedicalRecords(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const clinicIds = patient.clinics.map((cp) => cp.clinicId);
    return this.prisma.medicalRecord.findMany({
      where: { patientId: patient.id, clinicId: { in: clinicIds } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        doctor: { select: { specialization: true, user: { select: { name: true } } } },
        clinic: { select: { name: true } },
        appointment: { select: { appointmentDate: true } },
      },
    });
  }

  async getCurrentMedications(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const clinicIds = patient.clinics.map((cp) => cp.clinicId);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        patientId: patient.id,
        clinicId: { in: clinicIds },
        prescribedDate: { gte: sixMonthsAgo },
      },
      orderBy: { prescribedDate: 'desc' },
      include: {
        items: { include: { medication: { select: { name: true, category: true, strength: true } } } },
        doctor: { select: { user: { select: { name: true } } } },
      },
    });

    const medications: any[] = [];
    for (const rx of prescriptions) {
      for (const item of rx.items) {
        medications.push({
          medicationName: item.medication.name,
          category: item.medication.category,
          strength: item.medication.strength,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          prescribedDate: rx.prescribedDate,
          doctorName: rx.doctor?.user?.name,
        });
      }
    }
    return medications;
  }

  async getMedicines(
    userId: number,
    query?: { period?: string; clinicId?: string; q?: string; status?: string; page?: string; limit?: string },
  ) {
    const patient = await this.getPatientFromUserId(userId);
    const clinicIds = patient.clinics.map((cp) => cp.clinicId);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const dateFrom = query?.period === 'all' ? undefined
      : query?.period === '30days' ? thirtyDaysAgo
      : sixMonthsAgo;

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        patientId: patient.id,
        ...(clinicIds.length > 0 ? { clinicId: { in: clinicIds } } : {}),
        ...(dateFrom ? { prescribedDate: { gte: dateFrom } } : {}),
      },
      orderBy: { prescribedDate: 'desc' },
      include: {
        items: { include: { medication: true } },
        doctor: { select: { user: { select: { name: true } } } },
        clinic: { select: { name: true } },
      },
    });

    let medicines: any[] = [];
    for (const rx of prescriptions) {
      for (const item of rx.items) {
        const prescribedDate = new Date(rx.prescribedDate);
        let status = 'ACTIVE';
        const daysSince = Math.floor((now.getTime() - prescribedDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 180) status = 'ENDED';
        else if (daysSince > 30) status = 'PAST';

        medicines.push({
          id: String(item.id),
          medicineName: item.medication.name,
          activeIngredient: item.medication.activeIngredient || undefined,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions || undefined,
          prescriptionId: String(rx.id),
          prescriptionDate: rx.prescribedDate.toISOString(),
          doctorName: rx.doctor?.user?.name || '',
          clinicName: rx.clinic?.name || '',
          status,
        });
      }
    }

    if (query?.clinicId) {
      medicines = medicines.filter((m) => m.clinicName === query.clinicId);
    }
    if (query?.q) {
      const q = query.q.toLowerCase();
      medicines = medicines.filter(
        (m) => m.medicineName.toLowerCase().includes(q) || (m.activeIngredient && m.activeIngredient.toLowerCase().includes(q)),
      );
    }
    if (query?.status) {
      medicines = medicines.filter((m) => m.status === query.status);
    }

    const page = parseInt(query?.page || '1', 10);
    const limit = parseInt(query?.limit || '50', 10);
    const total = medicines.length;
    const start = (page - 1) * limit;
    const data = medicines.slice(start, start + limit);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getVisits(
    userId: number,
    query?: { period?: string; clinicId?: string; q?: string; page?: string; limit?: string },
  ) {
    const patient = await this.getPatientFromUserId(userId);
    const clinicIds = patient.clinics.map((cp) => cp.clinicId);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const dateFrom = query?.period === 'all' ? undefined
      : query?.period === '30days' ? thirtyDaysAgo
      : query?.period === '6months' ? sixMonthsAgo
      : undefined;

    const visits = await this.prisma.medicalRecord.findMany({
      where: {
        patientId: patient.id,
        ...(clinicIds.length > 0 ? { clinicId: { in: clinicIds } } : {}),
        ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),
        ...(query?.clinicId ? { clinicId: parseInt(query.clinicId, 10) } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        clinic: { select: { id: true, name: true, address: true, phone: true } },
        doctor: { select: { specialization: true, user: { select: { name: true } } } },
        appointment: { select: { appointmentDate: true } },
      },
    });

    let filtered = visits;

    if (query?.q) {
      const q = query.q.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.chiefComplaint?.toLowerCase().includes(q) ||
          v.diagnosis?.toLowerCase().includes(q) ||
          v.clinic?.name?.toLowerCase().includes(q) ||
          v.doctor?.user?.name?.toLowerCase().includes(q),
      );
    }

    const total = filtered.length;
    const page = parseInt(query?.page || '1', 10);
    const limit = parseInt(query?.limit || '50', 10);
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit).map((v) => ({
      id: String(v.id),
      date: v.createdAt.toISOString(),
      clinic: v.clinic ? { id: String(v.clinic.id), name: v.clinic.name } : null,
      doctor: v.doctor?.user?.name || '',
      specialization: v.doctor?.specialization || '',
      chiefComplaint: v.chiefComplaint || '',
      diagnosis: v.diagnosis || '',
      treatmentPlan: v.treatmentPlan || '',
      vitalSigns: v.vitalSigns || '',
      notes: v.notes || '',
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getVisitById(userId: number, visitId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const clinicIds = patient.clinics.map((cp) => cp.clinicId);

    const visit = await this.prisma.medicalRecord.findFirst({
      where: { id: visitId, patientId: patient.id, clinicId: { in: clinicIds } },
      include: {
        clinic: { select: { id: true, name: true, address: true, phone: true } },
        doctor: { select: { specialization: true, user: { select: { name: true } } } },
        appointment: { select: { appointmentDate: true, reason: true } },
      },
    });

    if (!visit) throw new NotFoundException('Visit not found');

    return {
      id: String(visit.id),
      date: visit.createdAt.toISOString(),
      appointmentDate: visit.appointment?.appointmentDate?.toISOString() || null,
      chiefComplaint: visit.chiefComplaint || '',
      diagnosis: visit.diagnosis || '',
      treatmentPlan: visit.treatmentPlan || '',
      vitalSigns: visit.vitalSigns || '',
      notes: visit.notes || '',
      clinic: visit.clinic ? { id: String(visit.clinic.id), name: visit.clinic.name, address: visit.clinic.address, phone: visit.clinic.phone } : null,
      doctor: visit.doctor?.user?.name || '',
      specialization: visit.doctor?.specialization || '',
      reason: visit.appointment?.reason || null,
    };
  }

  async getVisitsSummary(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const clinicIds = patient.clinics.map((cp) => cp.clinicId);

    const [totalVisits, clinicsLinked, reportsCount] = await Promise.all([
      this.prisma.medicalRecord.count({ where: { patientId: patient.id, clinicId: { in: clinicIds } } }),
      this.prisma.clinicPatient.count({ where: { patientId: patient.id, clinicId: { in: clinicIds } } }),
      this.prisma.medicalRecord.count({ where: { patientId: patient.id, clinicId: { in: clinicIds }, NOT: { diagnosis: '' } } }),
    ]);

    const lastVisit = await this.prisma.medicalRecord.findFirst({
      where: { patientId: patient.id, clinicId: { in: clinicIds } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, clinic: { select: { name: true } } },
    });

    return {
      totalVisits,
      lastVisitDate: lastVisit?.createdAt?.toISOString() || null,
      lastVisitClinic: lastVisit?.clinic?.name || null,
      clinicsLinked,
      reportsCount,
    };
  }

  async getFiles(userId: number, filters?: any) {
    const patient = await this.getPatientFromUserId(userId);
    
    let where: any = { patientId: patient.id };
    
    if (filters?.q) {
      where.title = { contains: filters.q };
    }
    if (filters?.category && filters.category !== 'ALL') {
      where.category = filters.category;
    }
    if (filters?.verificationStatus && filters.verificationStatus !== 'ALL') {
      where.verificationStatus = filters.verificationStatus;
    }
    if (filters?.clinicId && filters.clinicId !== 'ALL') {
      const parsedId = parseInt(filters.clinicId, 10);
      if (!isNaN(parsedId)) {
        where.clinicId = parsedId;
      }
    }
    if (filters?.period) {
      const now = new Date();
      if (filters.period === '30days') {
        where.createdAt = { gte: new Date(now.setDate(now.getDate() - 30)) };
      } else if (filters.period === '6months') {
        where.createdAt = { gte: new Date(now.setMonth(now.getMonth() - 6)) };
      } else if (filters.period === 'this_year') {
        where.createdAt = { gte: new Date(now.getFullYear(), 0, 1) };
      }
    }

    return this.prisma.patientMedicalFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { clinic: { select: { id: true, name: true } } },
    });
  }

  async uploadFile(userId: number, dto: any) {
    const patient = await this.getPatientFromUserId(userId);
    const clinicIds = patient.clinics.map((cp) => cp.clinicId);
    let targetClinicId = dto.clinicId ? parseInt(dto.clinicId, 10) : clinicIds[0];
    if (isNaN(targetClinicId) || !clinicIds.includes(targetClinicId)) {
      targetClinicId = clinicIds[0];
    }

    const file = await this.prisma.patientMedicalFile.create({
      data: {
        clinicId: targetClinicId || null,
        patientId: patient.id,
        title: dto.title || dto.fileName || 'Untitled',
        fileType: dto.fileType || 'application/octet-stream',
        fileUrl: dto.fileUrl || '',
        uploadedByType: 'PATIENT',
        category: dto.category,
        notes: dto.notes ? JSON.stringify({ notes: dto.notes, reportDate: dto.reportDate }) : undefined,
        reportDate: dto.reportDate ? new Date(dto.reportDate) : null,
        verificationStatus: 'PENDING_REVIEW',
      },
    });

    await this.prisma.patientMedicalTimelineEvent.create({
      data: {
        patientId: patient.id,
        clinicId: targetClinicId || null,
        type: 'FILE_UPLOAD',
        title: 'تم رفع ملف طبي بواسطة المريض',
        description: 'الملف بانتظار مراجعة العيادة',
        source: 'PATIENT',
        verificationStatus: 'PENDING_REVIEW',
        visibility: 'PATIENT_VISIBLE',
      },
    });

    return file;
  }

  async deleteFile(userId: number, fileId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const file = await this.prisma.patientMedicalFile.findUnique({
      where: { id: fileId },
    });

    if (!file) throw new NotFoundException('File not found');
    if (file.patientId !== patient.id) throw new ForbiddenException('Cannot delete this file');
    if (file.verificationStatus !== 'PENDING_REVIEW') throw new ForbiddenException('Cannot delete verified or rejected files');
    if (file.uploadedByType !== 'PATIENT') throw new ForbiddenException('Cannot delete clinic-uploaded files');

    return this.prisma.patientMedicalFile.delete({
      where: { id: fileId },
    });
  }

  async getNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getClinics(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    return patient.clinics.map((cp) => cp.clinic);
  }

  async getUnifiedMedicalHistory(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const clinicIds = patient.clinics.map((cp) => cp.clinicId);
    return this.medicalHistory.getUnifiedMedicalHistory(patient.id, {
      clinicIds,
      includeDoctorNotes: false,
    });
  }

  async getUnifiedMedicalTimeline(userId: number) {
    const profile = await this.getUnifiedMedicalHistory(userId);
    return profile?.timeline || [];
  }

  async getUnifiedMedicalSummary(userId: number) {
    const profile = await this.getUnifiedMedicalHistory(userId);
    if (!profile) throw new NotFoundException('Medical history not found');
    return {
      patient: profile.patient,
      summary: {
        allergies: profile.structuredProfile.allergies,
        chronicDiseases: profile.structuredProfile.chronicDiseases,
        surgeries: profile.structuredProfile.surgeries,
        familyHistory: profile.structuredProfile.familyHistory,
        currentMedications: profile.structuredProfile.currentMedications.slice(0, 10),
        latestPrescriptions: profile.structuredProfile.latestPrescriptions.slice(0, 5),
        recentDiagnoses: profile.structuredProfile.recentDiagnoses.slice(0, 5),
      },
      counts: profile.counts,
      generatedAt: profile.generatedAt,
    };
  }
}
