import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !port || !user || !pass) {
      this.logger.warn('SMTP credentials not fully configured. Emails will not be sent.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: parseInt(port, 10) === 465,
      auth: { user, pass },
    });
  }

  private getFromAddress(): string {
    return process.env.EMAIL_FROM || 'noreply@clinicpro.app';
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Skipping email to ${to}: SMTP not configured`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.getFromAddress(),
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
    }
  }

  async sendAppointmentConfirmation(
    patientEmail: string,
    patientName: string,
    doctorName: string,
    date: string,
    type: string,
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Appointment Confirmed</h2>
        <p>Dear ${patientName},</p>
        <p>Your appointment has been confirmed with the following details:</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Doctor</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${doctorName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${date}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Type</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${type}</td></tr>
        </table>
        <p>Please arrive 15 minutes before your scheduled time.</p>
        <p>Thank you,<br/>ClinicPro Team</p>
      </div>
    `;
    await this.sendMail(patientEmail, 'Appointment Confirmed', html);
  }

  async sendAppointmentReminder(
    patientEmail: string,
    patientName: string,
    doctorName: string,
    date: string,
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Appointment Reminder</h2>
        <p>Dear ${patientName},</p>
        <p>This is a reminder for your upcoming appointment:</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Doctor</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${doctorName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${date}</td></tr>
        </table>
        <p>Please ensure you arrive on time.</p>
        <p>Thank you,<br/>ClinicPro Team</p>
      </div>
    `;
    await this.sendMail(patientEmail, 'Appointment Reminder', html);
  }

  async sendPrescriptionNotification(
    patientEmail: string,
    patientName: string,
    doctorName: string,
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Prescription Available</h2>
        <p>Dear ${patientName},</p>
        <p>A new prescription has been created for you by Dr. ${doctorName}.</p>
        <p>Please check your account to view the details and download your prescription.</p>
        <p>Thank you,<br/>ClinicPro Team</p>
      </div>
    `;
    await this.sendMail(patientEmail, 'New Prescription', html);
  }

  async sendAppointmentRescheduled(
    patientEmail: string,
    patientName: string,
    doctorName: string,
    oldDate: string,
    newDate: string,
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Appointment Rescheduled</h2>
        <p>Dear ${patientName},</p>
        <p>Your appointment with Dr. ${doctorName} has been rescheduled.</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Previous Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${oldDate}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>New Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${newDate}</td></tr>
        </table>
        <p>We apologize for any inconvenience caused.</p>
        <p>Thank you,<br/>ClinicPro Team</p>
      </div>
    `;
    await this.sendMail(patientEmail, 'Appointment Rescheduled', html);
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Your OTP for email verification is:</p>
        <div style="text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 24px 0; color: #2563eb;">${otp}</div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Thank you,<br/>ClinicPro Team</p>
      </div>
    `;
    await this.sendMail(email, 'Email Verification OTP', html);
  }
}
