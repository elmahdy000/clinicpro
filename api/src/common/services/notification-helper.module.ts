import { Module } from '@nestjs/common';
import { NotificationsModule } from '../../notifications/notifications.module';
import { EventsModule } from '../../events/events.module';
import { MailModule } from '../../mail/mail.module';
import { NotificationHelperService } from './notification-helper.service';

@Module({
  imports: [NotificationsModule, EventsModule, MailModule],
  providers: [NotificationHelperService],
  exports: [NotificationHelperService],
})
export class NotificationHelperModule {}
