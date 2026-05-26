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
  FileTypeValidator,
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
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('upload')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @Get()
  findAll() {
    return this.uploadsService.findAll();
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
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
          new FileTypeValidator({ fileType: new RegExp(ALLOWED_MIMETYPES.join('|')) }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
    @Body() dto: UploadFileDto,
  ) {
    return this.uploadsService.upload(
      file,
      req.user.id,
      dto.patientId,
      dto.notes,
      dto.category,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE)
  @Get(':id/download')
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: any) {
    const fileRecord = await this.uploadsService.findOne(id);
    if (fs.existsSync(fileRecord.url)) {
      res.download(fileRecord.url, fileRecord.fileName);
    } else {
      throw new NotFoundException('File not found on disk');
    }
  }

  @Roles(UserRole.ADMIN)
  @Delete('files/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.uploadsService.remove(id);
  }
}