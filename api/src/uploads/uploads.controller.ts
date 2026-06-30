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
  Body,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';
import { UploadFileDto } from './dto/upload-file.dto';
import { allowedFileFilter, validateUploadedFile, MAX_FILE_SIZE_BYTES } from './file-validation';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('upload')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER, UserRole.PATIENT, UserRole.SUB_ADMIN)
  @Get()
  findAll(@Req() req: any) {
    return this.uploadsService.findAll(req.user);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER, UserRole.PATIENT, UserRole.SUB_ADMIN)
  @Post('medical-document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          // Use UUID + original extension — never trust the original filename for storage
          const safeExt = extname(file.originalname).toLowerCase();
          cb(null, `${uuidv4()}${safeExt}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: allowedFileFilter,
    }),
  )
  uploadMedicalDocument(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Body() dto: UploadFileDto,
  ) {
    // Second-layer validation after multer (catches edge cases)
    validateUploadedFile(file);
    return this.uploadsService.upload(file, req.user, dto.patientId, dto.notes, dto.category);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER, UserRole.PATIENT, UserRole.SUB_ADMIN)
  @Get(':id/download')
  async download(@Param('id', ParseIntPipe) id: number, @Req() req: any, @Res() res: any) {
    const fileRecord = await this.uploadsService.findOne(id, req.user);

    // Containment: always read by basename from inside the uploads directory. Stripping the
    // directory component neutralises legacy/imported records holding absolute or `../` paths
    // that would otherwise turn this endpoint into an arbitrary-file-read primitive.
    const uploadsRoot = path.resolve('./uploads');
    const resolved = path.resolve(uploadsRoot, path.basename(fileRecord.url));
    if (path.dirname(resolved) !== uploadsRoot || !fs.existsSync(resolved)) {
      throw new NotFoundException('File not found on disk');
    }
    res.download(resolved, fileRecord.fileName);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, UserRole.PLATFORM_OWNER, UserRole.PATIENT, UserRole.SUB_ADMIN)
  @Delete('files/:id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.uploadsService.remove(id, req.user);
  }
}
