import { Module } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordsController } from './medical-records.controller';
import { NotificationHelperModule } from '../common/services/notification-helper.module';

@Module({
  imports: [NotificationHelperModule],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
