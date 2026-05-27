import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Req, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ClinicsService } from './clinics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';

@Controller('clinics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get()
  @Roles(UserRole.PLATFORM_OWNER)
  findAll() {
    return this.clinicsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.PLATFORM_OWNER)
  findOne(@Param('id') id: string) {
    return this.clinicsService.findOne(+id);
  }

  @Post()
  @Roles(UserRole.PLATFORM_OWNER)
  create(@Body() body: any) {
    return this.clinicsService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.PLATFORM_OWNER, UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Req() req: any) {
    return this.clinicsService.update(id, body, req.user);
  }

  @Put(':id/logo')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueName = `logo-${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed for logo'), false);
        }
      },
    }),
  )
  uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) throw new BadRequestException('Logo file is required');
    return this.clinicsService.updateLogo(+id, file.filename, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.PLATFORM_OWNER)
  delete(@Param('id') id: string) {
    return this.clinicsService.delete(+id);
  }
}
