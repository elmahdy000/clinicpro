import { Controller, Delete, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user-role.enum';

@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.uploadsService.remove(id);
  }
}
