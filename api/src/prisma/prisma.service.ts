import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tenantStorage } from './tenant-context';

const tenantModels = [
  'ClinicSettings', 'User', 'Doctor', 'DoctorAvailability', 'DoctorTimeOff',
  'Appointment', 'MedicalRecord', 'Prescription', 'Invoice',
  'FileUpload', 'AuditLog', 'ClinicPatient'
];

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();

    this.$use(async (params, next) => {
      const store = tenantStorage.getStore();
      if (store && store.clinicId && tenantModels.includes(params.model as string)) {
        const action = params.action as string;
        if (action === 'findUnique' || action === 'findFirst') {
          params.action = 'findFirst';
          params.args.where = { ...params.args.where, clinicId: store.clinicId };
        }
        if (action === 'findMany' || action === 'count' || action === 'aggregate' || action === 'groupBy') {
          if (!params.args) params.args = {};
          params.args.where = { ...params.args.where, clinicId: store.clinicId };
        }
        if (action === 'create') {
          params.args.data = { ...params.args.data, clinicId: store.clinicId };
        }
        if (action === 'updateMany' || action === 'deleteMany') {
          params.args.where = { ...params.args.where, clinicId: store.clinicId };
        }
      }
      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
