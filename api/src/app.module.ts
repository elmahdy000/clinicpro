import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
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
import { LabModule } from './lab/lab.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
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
    LabModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
