import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterClinicDto } from './dto/register-clinic.dto';
import { LoginDto } from './dto/login.dto';
import { PatientLoginDto } from './dto/patient-login.dto';
import { PatientRegisterDto } from './dto/patient-register.dto';
import { tenantStorage } from '../prisma/tenant-context';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  private normalizePhone(phone: string): string {
    if (!phone) return '';

    const arabicToEnglishDigits: Record<string, string> = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    };

    const englishDigits = phone
      .trim()
      .replace(/[٠-٩]/g, (d) => arabicToEnglishDigits[d] ?? d);

    const digitsOnly = englishDigits.replace(/\D/g, '');

    if (digitsOnly.startsWith('20') && digitsOnly.length >= 12) {
      return `0${digitsOnly.slice(2)}`;
    }

    return digitsOnly;
  }

  async register(dto: RegisterDto) {
    return tenantStorage.run({ clinicId: null }, async () => {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already in use');

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          password: hashedPassword,
          role: dto.role,
        },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });

      await this.notificationsService.create({
        userId: user.id,
        title: 'Welcome to ClinicPro',
        message: `Welcome ${user.name}! Your account has been created successfully.`,
        type: 'INFO',
      }).catch((e) => this.logger.warn(`Welcome notification failed: ${(e as Error).message}`));

      return user;
    });
  }

  async registerClinic(dto: RegisterClinicDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return tenantStorage.run({ clinicId: null }, async () => {
      const clinic = await this.prisma.clinic.create({
        data: {
          name: dto.clinicName,
          phone: dto.clinicPhone || '',
          address: dto.clinicAddress || '',
          governorateId: dto.governorateId || undefined,
          cityId: dto.cityId || undefined,
          subscriptionPlan: 'FREE',
          subscriptionStatus: 'PENDING',
        }
      });

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          password: hashedPassword,
          role: 'CLINIC_ADMIN',
          clinicId: clinic.id,
        }
      });

      await this.prisma.doctor.create({
        data: {
          userId: user.id,
          specialization: dto.specialization || 'General',
          consultationFee: 200,
          status: 'ACTIVE',
          clinicId: clinic.id,
        }
      });

      return { message: 'Clinic registered successfully', clinicId: clinic.id };
    });
  }

  async login(dto: LoginDto) {
    const user = await tenantStorage.run({ clinicId: null }, async () => {
      return await this.prisma.user.findUnique({ where: { email: dto.email } });
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // Platform owners bypass clinic approval checks
    if (user.role !== 'PLATFORM_OWNER' && user.clinicId) {
      const clinic = await tenantStorage.run({ clinicId: null }, async () => {
        return await this.prisma.clinic.findUnique({
          where: { id: user.clinicId! },
          select: { approvalStatus: true, approvalNote: true, name: true },
        });
      });

      if (clinic) {
        if (clinic.approvalStatus === 'PENDING') {
          throw new UnauthorizedException(
            JSON.stringify({
              code: 'CLINIC_PENDING_APPROVAL',
              clinicName: clinic.name,
              message: 'طلب تسجيل العيادة قيد المراجعة. سيتم إشعارك بالموافقة عبر البريد الإلكتروني.',
            }),
          );
        }
        if (clinic.approvalStatus === 'REJECTED') {
          throw new UnauthorizedException(
            JSON.stringify({
              code: 'CLINIC_REJECTED',
              clinicName: clinic.name,
              approvalNote: clinic.approvalNote,
              message: 'تم رفض طلب تسجيل العيادة. يرجى التواصل مع الدعم الفني.',
            }),
          );
        }
      }
    }

    const payload = { email: user.email, sub: user.id, role: user.role, clinicId: user.clinicId };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async updateProfile(userId: number, dto: { name?: string; currentPassword?: string; newPassword?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const data: any = {};
    if (dto.name) data.name = dto.name;

    if (dto.currentPassword && dto.newPassword) {
      const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
      if (!isMatch) throw new UnauthorizedException('Current password is incorrect');
      data.password = await bcrypt.hash(dto.newPassword, 10);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, role: true, updatedAt: true },
    });
  }

  async patientLogin(dto: PatientLoginDto) {
    const normalizedIdentifier = this.normalizePhone(dto.identifier);
    const patient = await tenantStorage.run({ clinicId: null }, async () => {
      let patientId: number | undefined;
      if (dto.identifier && dto.identifier.toUpperCase().startsWith('P-')) {
        patientId = parseInt(dto.identifier.toUpperCase().replace('P-', ''), 10);
      }

      return await this.prisma.patient.findFirst({
        where: {
          OR: [
            { phone: normalizedIdentifier || dto.identifier.trim() },
            ...(patientId && !isNaN(patientId) ? [{ id: patientId }] : [])
          ]
        }
      });
    });
    if (!patient) throw new UnauthorizedException('رقم الهاتف أو كود المريض غير مسجل');

    if (!patient.userId) throw new UnauthorizedException('لا يوجد حساب مرتبط بهذا الرقم. الرجاء التسجيل أولاً.');

    const user = await tenantStorage.run({ clinicId: null }, async () => {
      return await this.prisma.user.findUnique({ where: { id: patient.userId! } });
    });
    if (!user) throw new UnauthorizedException('حساب المريض غير موجود');

    if (user.role !== 'PATIENT') throw new UnauthorizedException('هذا الحساب ليس حساب مريض');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('كلمة المرور غير صحيحة');

    const payload = { email: user.email, sub: user.id, role: user.role, clinicId: null };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async patientRegister(dto: PatientRegisterDto) {
    const normalizedPhone = this.normalizePhone(dto.phone);
    if (!normalizedPhone) throw new ConflictException('رقم الهاتف غير صالح');

    const existingUser = await tenantStorage.run({ clinicId: null }, async () => {
      return await this.prisma.user.findFirst({
        where: { email: `${normalizedPhone}@patient.clinicpro` },
      });
    });

    if (existingUser) throw new ConflictException('هذا الرقم مسجل بالفعل. الرجاء تسجيل الدخول.');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const nameParts = dto.fullName.trim().split(' ');
    const firstName = nameParts[0] || dto.fullName;
    const lastName = nameParts.slice(1).join(' ') || '';

    const user = await tenantStorage.run({ clinicId: null }, async () => {
      return await this.prisma.user.create({
        data: {
          email: `${normalizedPhone}@patient.clinicpro`,
          name: dto.fullName,
          password: hashedPassword,
          role: 'PATIENT',
        },
      });
    });

    const existingPatient = await tenantStorage.run({ clinicId: null }, async () => {
      return await this.prisma.patient.findFirst({ where: { phone: normalizedPhone } });
    });

    try {
      if (existingPatient) {
        await this.prisma.patient.update({
          where: { id: existingPatient.id },
          data: { userId: user.id, firstName, lastName, phone: normalizedPhone },
        });
      } else {
        await this.prisma.patient.create({
          data: {
            firstName,
            lastName,
            phone: normalizedPhone,
            userId: user.id,
          },
        });
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('هذا الرقم مسجل بالفعل. الرجاء تسجيل الدخول.');
      }
      throw error;
    }

    await this.notificationsService.create({
      userId: user.id,
      title: 'مرحباً بك في بوابة المريض',
      message: `مرحباً ${dto.fullName}! تم تفعيل حسابك في بوابة المريض. يمكنك الآن متابعة مواعيدك وروشتاتك.`,
      type: 'INFO',
    }).catch((e) => this.logger.warn(`Patient welcome notification failed: ${(e as Error).message}`));

    const payload = { email: user.email, sub: user.id, role: user.role, clinicId: null };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
