import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { MedicalHistoryModule } from '../medical-history/medical-history.module';

@Module({
  imports: [MedicalHistoryModule],
  controllers: [PatientsController],
  providers: [PatientsService],
})
export class PatientsModule {}
