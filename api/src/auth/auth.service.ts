import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

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
      }).catch(() => {});

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
          subscriptionPlan: 'FREE',
        }
      });

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          password: hashedPassword,
          role: 'DOCTOR',
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
    const patient = await tenantStorage.run({ clinicId: null }, async () => {
      return await this.prisma.patient.findUnique({ where: { phone: dto.phone } });
    });
    if (!patient) throw new UnauthorizedException('رقم الهاتف غير مسجل');

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
    const existingPatient = await tenantStorage.run({ clinicId: null }, async () => {
      return await this.prisma.patient.findUnique({ where: { phone: dto.phone } });
    });

    if (!existingPatient) throw new BadRequestException(
      'رقم الهاتف غير مسجل في أي عيادة. يجب أن يتم إضافتك بواسطة العيادة أولاً.',
    );

    if (existingPatient.userId) throw new ConflictException('هذا الرقم مسجل بالفعل. الرجاء تسجيل الدخول.');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await tenantStorage.run({ clinicId: null }, async () => {
      return await this.prisma.user.create({
        data: {
          email: `${dto.phone}@patient.clinicpro`,
          name: dto.name,
          password: hashedPassword,
          role: 'PATIENT',
        },
      });
    });

    await this.prisma.patient.update({
      where: { id: existingPatient.id },
      data: { userId: user.id },
    });

    await this.notificationsService.create({
      userId: user.id,
      title: 'مرحباً بك في بوابة المريض',
      message: `مرحباً ${dto.name}! تم تفعيل حسابك في بوابة المريض. يمكنك الآن متابعة مواعيدك وروشتاتك.`,
      type: 'INFO',
    }).catch(() => {});

    const payload = { email: user.email, sub: user.id, role: user.role, clinicId: null };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
