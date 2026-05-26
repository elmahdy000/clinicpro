import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MedicationsModule } from '../medications/medications.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [PrismaModule, MedicationsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
