import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../../notifications/notifications.service';
import { EventsGateway } from '../../events/events.gateway';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class NotificationHelperService {
  private readonly logger = new Logger(NotificationHelperService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly eventsGateway: EventsGateway,
    private readonly mailService: MailService,
  ) {}

  async sendAppointmentCreated(appointment: any, doctorUser: any, patient: any): Promise<void> {
    try {
      const patientNotification = await this.notificationsService.create({
        userId: patient.userId,
        title: 'Appointment Confirmed',
        message: `Your appointment with Dr. ${doctorUser.name} on ${new Date(appointment.appointmentDate).toLocaleDateString()} has been confirmed.`,
        type: 'APPOINTMENT',
        referenceType: 'appointment',
        referenceId: appointment.id,
      });
      this.eventsGateway.sendNotification(patient.userId, patientNotification);

      const doctorNotification = await this.notificationsService.create({
        userId: doctorUser.id,
        title: 'New Appointment',
        message: `New appointment scheduled with ${patient.firstName} ${patient.lastName} on ${new Date(appointment.appointmentDate).toLocaleDateString()}.`,
        type: 'APPOINTMENT',
        referenceType: 'appointment',
        referenceId: appointment.id,
      });
      this.eventsGateway.sendNotification(doctorUser.id, doctorNotification);

      this.mailService.sendAppointmentConfirmation(
        patient.email,
        `${patient.firstName} ${patient.lastName}`,
        doctorUser.name,
        new Date(appointment.appointmentDate).toLocaleString(),
        appointment.type,
      ).catch((e) => this.logger.warn(`Mail sendAppointmentConfirmation failed: ${(e as Error).message}`));
    } catch (error) {
      this.logger.error(`sendAppointmentCreated failed: ${(error as Error).message}`);
    }
  }

  async sendAppointmentCancelled(appointment: any, doctorUser: any, patient: any): Promise<void> {
    try {
      const patientNotification = await this.notificationsService.create({
        userId: patient.userId,
        title: 'Appointment Cancelled',
        message: `Your appointment with Dr. ${doctorUser.name} on ${new Date(appointment.appointmentDate).toLocaleDateString()} has been cancelled.`,
        type: 'APPOINTMENT',
        referenceType: 'appointment',
        referenceId: appointment.id,
      });
      this.eventsGateway.sendNotification(patient.userId, patientNotification);

      const doctorNotification = await this.notificationsService.create({
        userId: doctorUser.id,
        title: 'Appointment Cancelled',
        message: `Appointment with ${patient.firstName} ${patient.lastName} on ${new Date(appointment.appointmentDate).toLocaleDateString()} has been cancelled.`,
        type: 'APPOINTMENT',
        referenceType: 'appointment',
        referenceId: appointment.id,
      });
      this.eventsGateway.sendNotification(doctorUser.id, doctorNotification);

      this.mailService.sendMail(
        patient.email,
        'Appointment Cancelled',
        `<p>Dear ${patient.firstName} ${patient.lastName},</p><p>Your appointment with Dr. ${doctorUser.name} on ${new Date(appointment.appointmentDate).toLocaleString()} has been cancelled.</p>`,
      ).catch((e) => this.logger.warn(`Mail send cancelled failed: ${(e as Error).message}`));
    } catch (error) {
      this.logger.error(`sendAppointmentCancelled failed: ${(error as Error).message}`);
    }
  }

  async sendAppointmentUpdated(appointment: any, doctorUser: any, patient: any, oldDate?: string, reason?: string): Promise<void> {
    try {
      const oldDateMsg = oldDate ? ` (was ${new Date(oldDate).toLocaleString()})` : '';
      const reasonMsg = reason ? ` Reason: ${reason}.` : '';
      const patientNotification = await this.notificationsService.create({
        userId: patient.userId,
        title: 'Appointment Rescheduled',
        message: `Your appointment with Dr. ${doctorUser.name} has been rescheduled to ${new Date(appointment.appointmentDate).toLocaleString()}.${oldDateMsg}${reasonMsg}`,
        type: 'APPOINTMENT',
        referenceType: 'appointment',
        referenceId: appointment.id,
      });
      this.eventsGateway.sendNotification(patient.userId, patientNotification);

      const doctorNotification = await this.notificationsService.create({
        userId: doctorUser.id,
        title: 'Appointment Rescheduled',
        message: `Appointment with ${patient.firstName} ${patient.lastName} has been rescheduled to ${new Date(appointment.appointmentDate).toLocaleString()}.${oldDateMsg}${reasonMsg}`,
        type: 'APPOINTMENT',
        referenceType: 'appointment',
        referenceId: appointment.id,
      });
      this.eventsGateway.sendNotification(doctorUser.id, doctorNotification);

      this.mailService.sendAppointmentRescheduled(
        patient.email,
        `${patient.firstName} ${patient.lastName}`,
        doctorUser.name,
        oldDate ? new Date(oldDate).toLocaleString() : 'N/A',
        new Date(appointment.appointmentDate).toLocaleString(),
      ).catch((e) => this.logger.warn(`Mail reschedule failed: ${(e as Error).message}`));
    } catch (error) {
      this.logger.error(`sendAppointmentUpdated failed: ${(error as Error).message}`);
    }
  }

  async sendPrescriptionCreated(prescription: any, doctorUser: any, patient: any): Promise<void> {
    try {
      const patientNotification = await this.notificationsService.create({
        userId: patient.userId,
        title: 'New Prescription',
        message: `Dr. ${doctorUser.name} has issued a new prescription for you.`,
        type: 'PRESCRIPTION',
        referenceType: 'prescription',
        referenceId: prescription.id,
      });
      this.eventsGateway.sendNotification(patient.userId, patientNotification);

      this.mailService.sendPrescriptionNotification(
        patient.email,
        `${patient.firstName} ${patient.lastName}`,
        doctorUser.name,
      ).catch((e) => this.logger.warn(`Mail prescription failed: ${(e as Error).message}`));
    } catch (error) {
      this.logger.error(`sendPrescriptionCreated failed: ${(error as Error).message}`);
    }
  }

  async sendMedicalRecordCreated(record: any, doctorUser: any, patient: any): Promise<void> {
    try {
      const patientNotification = await this.notificationsService.create({
        userId: patient.userId,
        title: 'Medical Record Updated',
        message: `Dr. ${doctorUser.name} has added a new medical record for you.`,
        type: 'MEDICAL_RECORD',
        referenceType: 'medicalRecord',
        referenceId: record.id,
      });
      this.eventsGateway.sendNotification(patient.userId, patientNotification);
    } catch (error) {
      this.logger.error(`sendMedicalRecordCreated failed: ${(error as Error).message}`);
    }
  }

  async sendOtpVerified(email: string, userId: number): Promise<void> {
    try {
      const notification = await this.notificationsService.create({
        userId,
        title: 'Email Verified',
        message: 'Your email has been successfully verified.',
        type: 'INFO',
        referenceType: 'otp',
      });
      this.eventsGateway.sendNotification(userId, notification);
    } catch (error) {
      this.logger.error(`sendOtpVerified failed: ${(error as Error).message}`);
    }
  }
}
