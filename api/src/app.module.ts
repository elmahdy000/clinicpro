import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { UploadsModule } from './uploads/uploads.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OtpModule } from './otp/otp.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EventsModule } from './events/events.module';
import { MailModule } from './mail/mail.module';
import { NotificationHelperModule } from './common/services/notification-helper.module';
import { RemindersModule } from './reminders/reminders.module';
import { BillingModule } from './billing/billing.module';
import { ClinicsModule } from './clinics/clinics.module';
import { AppController } from './app.controller';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { MedicationsModule } from './medications/medications.module';
import { PatientPortalModule } from './patient-portal/patient-portal.module';
import { InventoryModule } from './inventory/inventory.module';
import { LocationsModule } from './locations/locations.module';
import { MyMedicinesModule } from './my-medicines/my-medicines.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    MedicalRecordsModule,
    PrescriptionsModule,
    UploadsModule,
    DashboardModule,
    OtpModule,
    NotificationsModule,
    EventsModule,
    MailModule,
    NotificationHelperModule,
    RemindersModule,
    BillingModule,
    ClinicsModule,
    MedicationsModule,
    PatientPortalModule,
    InventoryModule,
    LocationsModule,
    MyMedicinesModule,
  ],
  controllers: [AppController],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
