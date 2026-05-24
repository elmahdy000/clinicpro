import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async register(dto: RegisterDto) {
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
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { email: user.email, sub: user.id, role: user.role };
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
}
