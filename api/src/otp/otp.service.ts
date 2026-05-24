import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationHelperService } from '../common/services/notification-helper.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private notificationHelper: NotificationHelperService,
  ) {}

  async sendOtp(email: string) {
    const patient = await this.prisma.patient.findFirst({ where: { email } });
    if (!patient) throw new NotFoundException('Patient with this email not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.otpVerification.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    this.mailService.sendOtpEmail(email, otp).catch((e) => this.logger.warn(`Failed to send OTP email: ${(e as Error).message}`));

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const pending = await this.prisma.otpVerification.findFirst({
      where: { email, expiresAt: { gt: new Date() }, attempts: { lt: 5 } },
      orderBy: { createdAt: 'desc' },
    });

    if (!pending || pending.otp !== otp) {
      if (pending) {
        await this.prisma.otpVerification.update({
          where: { id: pending.id },
          data: { attempts: { increment: 1 } },
        });
      }
      throw new BadRequestException('Invalid or expired OTP');
    }

    const patientToUpdate = await this.prisma.patient.findFirst({ where: { email } });
    if (patientToUpdate) {
      await this.prisma.patient.update({
        where: { id: patientToUpdate.id },
        data: { emailVerifiedAt: new Date() },
      });
    }

    await this.prisma.otpVerification.delete({ where: { id: pending.id } });

    const patient = await this.prisma.patient.findFirst({ where: { email } });
    if (patient?.userId) {
      this.notificationHelper.sendOtpVerified(email, patient.userId).catch((e) => this.logger.warn(`OTP verify notification failed: ${(e as Error).message}`));
    }

    return { message: 'Email verified successfully' };
  }
}
