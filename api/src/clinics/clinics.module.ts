import { Module } from '@nestjs/common';
import { ClinicsController } from './clinics.controller';
import { ClinicsService } from './clinics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationHelperModule } from '../common/services/notification-helper.module';

@Module({
  imports: [PrismaModule, NotificationHelperModule],
  controllers: [ClinicsController],
  providers: [ClinicsService],
})
export class ClinicsModule {}
