import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientPortalService {
  constructor(private prisma: PrismaService) {}

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

  async getFiles(userId: number) {
    const patient = await this.getPatientFromUserId(userId);
    const clinicIds = patient.clinics.map((cp) => cp.clinicId);
    return this.prisma.fileUpload.findMany({
      where: { clinicId: { in: clinicIds }, patientId: patient.id },
      orderBy: { uploadedAt: 'desc' },
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
}
