import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { MailModule } from '../mail/mail.module';
import { NotificationHelperModule } from '../common/services/notification-helper.module';

@Module({
  imports: [MailModule, NotificationHelperModule],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}
