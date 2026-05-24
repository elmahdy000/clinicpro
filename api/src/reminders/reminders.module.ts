import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { RemindersService } from './reminders.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    NotificationsModule,
    EventsModule,
    MailModule,
  ],
  providers: [RemindersService],
})
export class RemindersModule {}
