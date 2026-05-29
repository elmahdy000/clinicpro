import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { PatientPortalService } from './patient-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';

@Controller('patient-portal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
export class PatientPortalController {
  constructor(private readonly service: PatientPortalService) {}

  @Get('patient/me')
  getMe(@Req() req: any) {
    return this.service.getMe(req.user.id);
  }

  @Get('patient/dashboard/overview')
  getOverview(@Req() req: any) {
    return this.service.getOverview(req.user.id);
  }

  @Get('patient/dashboard/appointments')
  getDashboardAppointments(@Req() req: any) {
    return this.service.getDashboardAppointments(req.user.id);
  }

  @Get('patient/dashboard/prescriptions')
  getDashboardPrescriptions(@Req() req: any) {
    return this.service.getDashboardPrescriptions(req.user.id);
  }

  @Get('patient/dashboard/visits')
  getDashboardVisits(@Req() req: any) {
    return this.service.getDashboardVisits(req.user.id);
  }

  @Get('patient/dashboard/notifications')
  getDashboardNotifications(@Req() req: any) {
    return this.service.getDashboardNotifications(req.user.id);
  }

  @Get('patient/dashboard/clinics')
  getDashboardClinics(@Req() req: any) {
    return this.service.getDashboardClinics(req.user.id);
  }

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.service.getDashboard(req.user.id);
  }

  @Get('appointments')
  getAppointments(@Req() req: any) {
    return this.service.getAppointments(req.user.id);
  }

  @Get('prescriptions')
  getPrescriptions(@Req() req: any) {
    return this.service.getPrescriptions(req.user.id);
  }

  @Get('medical-records')
  getMedicalRecords(@Req() req: any) {
    return this.service.getMedicalRecords(req.user.id);
  }

  @Get('medications')
  getCurrentMedications(@Req() req: any) {
    return this.service.getCurrentMedications(req.user.id);
  }

  @Get('files')
  getFiles(@Req() req: any) {
    return this.service.getFiles(req.user.id);
  }

  @Get('notifications')
  getNotifications(@Req() req: any) {
    return this.service.getNotifications(req.user.id);
  }

  @Get('clinics')
  getClinics(@Req() req: any) {
    return this.service.getClinics(req.user.id);
  }
}
