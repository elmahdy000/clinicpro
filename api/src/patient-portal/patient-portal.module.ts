import { Module } from '@nestjs/common';
import { PatientPortalController } from './patient-portal.controller';
import { PatientPortalService } from './patient-portal.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PatientDashboardController } from './patient-dashboard.controller';
import { MedicalHistoryModule } from '../medical-history/medical-history.module';

@Module({
  imports: [PrismaModule, MedicalHistoryModule],
  controllers: [PatientPortalController, PatientDashboardController],
  providers: [PatientPortalService],
})
export class PatientPortalModule {}
