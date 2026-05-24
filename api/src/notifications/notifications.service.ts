import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type ?? 'INFO',
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
      },
    });
  }

  async findAll(userId: number, query?: QueryNotificationDto): Promise<PaginatedResult<any>> {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const where: any = { userId };

    if (query?.isRead !== undefined) {
      where.isRead = query.isRead;
    }
    if (query?.type) {
      where.type = query.type;
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification #${id} not found`);
    }
    return notification;
  }

  async markAsRead(id: number) {
    await this.findOne(id);
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.notification.delete({ where: { id } });
  }

  async countUnread(userId: number) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }
}
