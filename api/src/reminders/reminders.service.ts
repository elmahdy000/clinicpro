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
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

    const overdue = await this.prisma.appointment.findMany({
      where: {
        appointmentDate: { gte: todayStart, lt: tenMinAgo },
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
}