import { Controller, Get, Post, Delete, Body, Req, UseGuards, Query, Param, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';
import { PatientPortalService } from './patient-portal.service';

@Controller('patient')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
export class PatientDashboardController {
  constructor(private readonly service: PatientPortalService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return this.service.getMe(req.user.id);
  }

  @Get('dashboard/overview')
  getOverview(@Req() req: any) {
    return this.service.getOverview(req.user.id);
  }

  @Get('dashboard/appointments')
  getDashboardAppointments(@Req() req: any) {
    return this.service.getDashboardAppointments(req.user.id);
  }

  @Get('dashboard/prescriptions')
  getDashboardPrescriptions(@Req() req: any) {
    return this.service.getDashboardPrescriptions(req.user.id);
  }

  @Get('dashboard/visits')
  getDashboardVisits(@Req() req: any) {
    return this.service.getDashboardVisits(req.user.id);
  }

  @Get('dashboard/notifications')
  getDashboardNotifications(@Req() req: any) {
    return this.service.getDashboardNotifications(req.user.id);
  }

  @Get('dashboard/clinics')
  getDashboardClinics(@Req() req: any) {
    return this.service.getDashboardClinics(req.user.id);
  }

  @Get('visits/summary')
  getVisitsSummary(@Req() req: any) {
    return this.service.getVisitsSummary(req.user.id);
  }

  @Get('visits')
  getVisits(
    @Req() req: any,
    @Query('period') period?: string,
    @Query('clinicId') clinicId?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getVisits(req.user.id, { period, clinicId, q, page, limit });
  }

  @Get('visits/:id')
  getVisitById(@Req() req: any, @Param('id') id: string) {
    return this.service.getVisitById(req.user.id, parseInt(id, 10));
  }

  @Get('medicines')
  getMedicines(
    @Req() req: any,
    @Query('period') period?: string,
    @Query('clinicId') clinicId?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getMedicines(req.user.id, { period, clinicId, q, status, page, limit });
  }

  @Get('medical-history')
  getMedicalHistory(@Req() req: any) {
    return this.service.getUnifiedMedicalHistory(req.user.id);
  }

  @Get('medical-history/timeline')
  getMedicalHistoryTimeline(@Req() req: any) {
    return this.service.getUnifiedMedicalTimeline(req.user.id);
  }

  @Get('medical-history/summary')
  getMedicalHistorySummary(@Req() req: any) {
    return this.service.getUnifiedMedicalSummary(req.user.id);
  }

  @Get('files')
  getFiles(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('clinicId') clinicId?: string,
    @Query('period') period?: string,
  ) {
    return this.service.getFiles(req.user.id, { q, category, verificationStatus, clinicId, period });
  }

  @Post('files')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueName = uuidv4() + extname(file.originalname);
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain', 'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`File type ${file.mimetype} not allowed.`), false);
        }
      },
    }),
  )
  uploadFile(@Req() req: any, @UploadedFile() file: Express.Multer.File, @Body() dto: any) {
    if (!file) throw new BadRequestException('File is required');
    dto.fileUrl = `/uploads/${file.filename}`;
    dto.fileName = dto.title || file.originalname;
    dto.fileType = file.mimetype;
    return this.service.uploadFile(req.user.id, dto);
  }

  @Delete('files/:id')
  deleteFile(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteFile(req.user.id, parseInt(id, 10));
  }
}
