import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { FilesController } from './files.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [UploadsController, FilesController],
  providers: [UploadsService],
})
export class UploadsModule {}
