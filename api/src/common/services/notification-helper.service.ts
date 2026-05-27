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

  async sendInvoiceCreated(invoice: any, patient: any, clinicName: string): Promise<void> {
    try {
      if (!patient.userId) return;
      const patientNotification = await this.notificationsService.create({
        userId: patient.userId,
        title: 'New Invoice Issued',
        message: `A new invoice (${invoice.invoiceNumber}) of ${invoice.total} EGP has been issued to you by ${clinicName}.`,
        type: 'INVOICE',
        referenceType: 'invoice',
        referenceId: invoice.id,
      });
      this.eventsGateway.sendNotification(patient.userId, patientNotification);

      if (patient.email) {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #2563eb;">New Invoice Issued</h2>
            <p>Dear ${patient.firstName} ${patient.lastName},</p>
            <p>A new invoice has been generated for your medical services at <strong>${clinicName}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Invoice Number</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${invoice.invoiceNumber}</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Total Amount</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${invoice.total} EGP</td></tr>
              <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Due Date</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon receipt'}</td></tr>
            </table>
            <p>Please review and complete the payment at your earliest convenience.</p>
            <p>Thank you,<br/>${clinicName} Team</p>
          </div>
        `;
        await this.mailService.sendMail(patient.email, `New Invoice: ${invoice.invoiceNumber}`, html)
          .catch((e) => this.logger.warn(`Mail sendInvoiceCreated failed: ${(e as Error).message}`));
      }
    } catch (error) {
      this.logger.error(`sendInvoiceCreated failed: ${(error as Error).message}`);
    }
  }

  async sendInvoicePaid(invoice: any, patient: any, clinicName: string): Promise<void> {
    try {
      if (!patient.userId) return;
      const patientNotification = await this.notificationsService.create({
        userId: patient.userId,
        title: 'Invoice Payment Confirmed',
        message: `Your payment of ${invoice.total} EGP for invoice ${invoice.invoiceNumber} has been received successfully. Thank you!`,
        type: 'INVOICE',
        referenceType: 'invoice',
        referenceId: invoice.id,
      });
      this.eventsGateway.sendNotification(patient.userId, patientNotification);

      if (patient.email) {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #10b981;">Payment Received Successfully</h2>
            <p>Dear ${patient.firstName} ${patient.lastName},</p>
            <p>Thank you! Your payment of <strong>${invoice.total} EGP</strong> has been successfully processed.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Invoice Number</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${invoice.invoiceNumber}</td></tr>
              <tr><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Payment Method</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${invoice.paymentMethod || 'Credit Card'}</td></tr>
              <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Date Paid</strong></td><td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date().toLocaleDateString()}</td></tr>
            </table>
            <p>This email serves as an official receipt for your transaction.</p>
            <p>Thank you,<br/>${clinicName} Team</p>
          </div>
        `;
        await this.mailService.sendMail(patient.email, `Receipt for Invoice: ${invoice.invoiceNumber}`, html)
          .catch((e) => this.logger.warn(`Mail sendInvoicePaid failed: ${(e as Error).message}`));
      }
    } catch (error) {
      this.logger.error(`sendInvoicePaid failed: ${(error as Error).message}`);
    }
  }

  async sendQueuePositionCalled(patient: any, doctorName: string, queuePosition: number): Promise<void> {
    try {
      if (!patient.userId) return;
      const patientNotification = await this.notificationsService.create({
        userId: patient.userId,
        title: 'Your Turn is Next!',
        message: `Please proceed to Dr. ${doctorName}'s examination room. Your queue position is #${queuePosition}.`,
        type: 'QUEUE',
        referenceType: 'queue',
      });
      this.eventsGateway.sendNotification(patient.userId, patientNotification);
    } catch (error) {
      this.logger.error(`sendQueuePositionCalled failed: ${(error as Error).message}`);
    }
  }

  async sendMedicationLowStock(clinicAdminUserId: number, medicationName: string, currentStock: number): Promise<void> {
    try {
      const adminNotification = await this.notificationsService.create({
        userId: clinicAdminUserId,
        title: 'Low Medication Stock Alert',
        message: `Inventory Alert: Stock for "${medicationName}" is very low (Only ${currentStock} item(s) remaining). Please reorder soon.`,
        type: 'STOCK',
        referenceType: 'stock',
      });
      this.eventsGateway.sendNotification(clinicAdminUserId, adminNotification);
    } catch (error) {
      this.logger.error(`sendMedicationLowStock failed: ${(error as Error).message}`);
    }
  }

  async sendSubscriptionEnding(clinicAdminUserId: number, clinicName: string, daysLeft: number): Promise<void> {
    try {
      const adminNotification = await this.notificationsService.create({
        userId: clinicAdminUserId,
        title: 'Subscription Expiry Imminent',
        message: `Renewal Alert: Your ClinicPro subscription plan for "${clinicName}" is expiring in ${daysLeft} day(s). Please renew your plan.`,
        type: 'SUBSCRIPTION',
        referenceType: 'subscription',
      });
      this.eventsGateway.sendNotification(clinicAdminUserId, adminNotification);
    } catch (error) {
      this.logger.error(`sendSubscriptionEnding failed: ${(error as Error).message}`);
    }
  }

  async sendSubscriptionUpgraded(platformOwnerUserId: number, clinicName: string, newPlan: string): Promise<void> {
    try {
      const poNotification = await this.notificationsService.create({
        userId: platformOwnerUserId,
        title: 'SaaS Subscription Upgraded',
        message: `SaaS Growth Alert: The clinic "${clinicName}" has successfully upgraded to the "${newPlan}" tier!`,
        type: 'SUBSCRIPTION',
        referenceType: 'subscription',
      });
      this.eventsGateway.sendNotification(platformOwnerUserId, poNotification);
    } catch (error) {
      this.logger.error(`sendSubscriptionUpgraded failed: ${(error as Error).message}`);
    }
  }

  async sendMedicationRefillReminder(patient: any, doctorName: string, medicationName: string, rxId: number): Promise<void> {
    try {
      if (!patient.userId) return;
      const patientNotification = await this.notificationsService.create({
        userId: patient.userId,
        title: 'Medication Refill Reminder',
        message: `Your medication "${medicationName}" from prescription #${rxId} is running low. Please schedule an appointment with Dr. ${doctorName} for a refill.`,
        type: 'PRESCRIPTION',
        referenceType: 'prescription',
        referenceId: rxId,
      });
      this.eventsGateway.sendNotification(patient.userId, patientNotification);

      if (patient.email) {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #ea580c;">Medication Refill Reminder</h2>
            <p>Dear ${patient.firstName} ${patient.lastName},</p>
            <p>This is a friendly reminder that your medication <strong>"${medicationName}"</strong> prescribed by Dr. <strong>${doctorName}</strong> is running low (approximately 5 days left).</p>
            <p>To ensure continuity of your treatment, please check your supply and schedule a follow-up or contact the clinic for a refill.</p>
            <p>Thank you,<br/>ClinicPro Team</p>
          </div>
        `;
        await this.mailService.sendMail(patient.email, 'Medication Refill Reminder', html)
          .catch((e) => this.logger.warn(`Mail sendMedicationRefillReminder failed: ${(e as Error).message}`));
      }
    } catch (error) {
      this.logger.error(`sendMedicationRefillReminder failed: ${(error as Error).message}`);
    }
  }
}
