import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  Res,
  BadRequestException,
  NotFoundException,
  MaxFileSizeValidator,
  ParseFilePipe,
  Body,
} from '@nestjs/common';
import * as fs from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';
import { UploadFileDto } from './dto/upload-file.dto';

const ALLOWED_MIMETYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/dicom',
  'application/x-dicom',
  'application/x-zip-compressed',
  'application/zip',
  'text/csv',
  'application/octet-stream',
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('upload')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER, UserRole.PATIENT)
  @Get()
  findAll(@Req() req: any) {
    return this.uploadsService.findAll(req.user);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER, UserRole.PATIENT)
  @Post('medical-document')
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
        if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`File type ${file.mimetype} not allowed. Allowed: images, PDF, DOC, XLS, TXT`), false);
        }
      },
    }),
  )
  uploadMedicalDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
    @Body() dto: UploadFileDto,
  ) {
    return this.uploadsService.upload(
      file,
      req.user,
      dto.patientId,
      dto.notes,
      dto.category,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER, UserRole.PATIENT)
  @Get(':id/download')
  async download(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Res() res: any) {
    const fileRecord = await this.uploadsService.findOne(id, req.user);
    if (fs.existsSync(fileRecord.url)) {
      res.download(fileRecord.url, fileRecord.fileName);
    } else {
      throw new NotFoundException('File not found on disk');
    }
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER, UserRole.PATIENT)
  @Delete('files/:id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.uploadsService.remove(id, req.user);
  }
}
