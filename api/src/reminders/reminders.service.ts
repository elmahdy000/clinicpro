import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import { MailService } from '../mail/mail.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly eventsGateway: EventsGateway,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleAppointmentReminders() {
    this.logger.log('Checking for upcoming appointment reminders...');

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        appointmentDate: { gte: now, lte: in24h },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    for (const apt of appointments) {
      try {
        const patientUserId = apt.patient.userId;
        if (!patientUserId) continue;

        const notification = await this.notificationsService.create({
          userId: patientUserId,
          title: 'Appointment Reminder',
          message: `Reminder: You have an appointment with Dr. ${apt.doctor.user.name} at ${new Date(apt.appointmentDate).toLocaleString()}.`,
          type: 'APPOINTMENT',
          referenceType: 'appointment',
          referenceId: apt.id,
        });

        this.eventsGateway.sendNotification(patientUserId, notification);

        if (apt.patient.email) {
          await this.mailService.sendAppointmentReminder(
            apt.patient.email,
            `${apt.patient.firstName} ${apt.patient.lastName}`,
            apt.doctor.user.name,
            new Date(apt.appointmentDate).toLocaleString(),
          );
        }

        this.logger.log(`Reminder sent for appointment #${apt.id}`);
      } catch (error) {
        this.logger.error(`Failed to send reminder for appointment #${apt.id}: ${(error as Error).message}`);
      }
    }

    this.logger.log(`Processed ${appointments.length} appointment reminder(s)`);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleNoShowDetection() {
    this.logger.log('Checking for no-show appointments...');
    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const overdue = await this.prisma.appointment.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        appointmentEndDate: { lt: tenMinAgo },
      },
    });

    for (const apt of overdue) {
      await this.prisma.appointment.update({
        where: { id: apt.id },
        data: { status: 'MISSED' },
      });
      await this.prisma.appointmentStatusChange.create({
        data: {
          appointmentId: apt.id,
          fromStatus: apt.status,
          toStatus: 'MISSED',
        },
      });
      this.logger.log(`Appointment #${apt.id} auto-marked as MISSED (no-show)`);
    }

    if (overdue.length > 0) {
      this.logger.log(`Marked ${overdue.length} appointment(s) as MISSED`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleMedicationRefillReminders() {
    this.logger.log('Checking for chronic medication refill reminders...');
    const now = new Date();
    const targetDate = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);
    const startOfTarget = new Date(targetDate); startOfTarget.setHours(0,0,0,0);
    const endOfTarget = new Date(targetDate); endOfTarget.setHours(23,59,59,999);

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        prescribedDate: { gte: startOfTarget, lte: endOfTarget },
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        items: { include: { medication: true } },
      },
    });

    for (const rx of prescriptions) {
      try {
        const patientUserId = rx.patient.userId;
        if (!patientUserId) continue;

        for (const item of rx.items) {
          const durationVal = parseInt(item.duration, 10);
          if (durationVal >= 30) {
            const notification = await this.notificationsService.create({
              userId: patientUserId,
              title: 'Medication Refill Reminder',
              message: `Your medication "${item.medication.name}" from prescription #${rx.id} is running low. Please schedule an appointment with Dr. ${rx.doctor.user.name} for a refill.`,
              type: 'PRESCRIPTION',
              referenceType: 'prescription',
              referenceId: rx.id,
            });

            this.eventsGateway.sendNotification(patientUserId, notification);

            if (rx.patient.email) {
              const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                  <h2 style="color: #ea580c;">Medication Refill Reminder</h2>
                  <p>Dear ${rx.patient.firstName} ${rx.patient.lastName},</p>
                  <p>This is a friendly reminder that your medication <strong>"${item.medication.name}"</strong> prescribed by Dr. <strong>${rx.doctor.user.name}</strong> is running low (approximately 5 days left).</p>
                  <p>To ensure continuity of your treatment, please check your supply and schedule a follow-up or contact the clinic for a refill.</p>
                  <p>Thank you,<br/>ClinicPro Team</p>
                </div>
              `;
              await this.mailService.sendMail(rx.patient.email, 'Medication Refill Reminder', html).catch(() => {});
            }
          }
        }
      } catch (error) {
        this.logger.error(`Failed to send refill reminder for prescription #${rx.id}: ${(error as Error).message}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleSubscriptionReminders() {
    this.logger.log('Checking for subscription renewals...');
    const now = new Date();
    
    const clinics = await this.prisma.clinic.findMany({
      where: {
        subscriptionPlan: { not: 'FREE' },
        subscriptionStatus: 'ACTIVE',
      },
      include: {
        users: { where: { role: 'CLINIC_ADMIN' } },
      },
    });

    for (const clinic of clinics) {
      try {
        const ageInMs = now.getTime() - clinic.createdAt.getTime();
        const daysSinceRenewal = Math.floor(ageInMs / (24 * 60 * 60 * 1000)) % 30;
        const daysLeft = 30 - daysSinceRenewal;

        if (daysLeft === 3 || daysLeft === 1) {
          for (const admin of clinic.users) {
            const notification = await this.notificationsService.create({
              userId: admin.id,
              title: 'Subscription Renewal Alert',
              message: `Renewal Alert: Your ClinicPro subscription plan for "${clinic.name}" is expiring in ${daysLeft} day(s). Please renew your plan.`,
              type: 'SUBSCRIPTION',
              referenceType: 'subscription',
            });

            this.eventsGateway.sendNotification(admin.id, notification);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to process subscription reminder for clinic #${clinic.id}: ${(error as Error).message}`);
      }
    }
  }
}