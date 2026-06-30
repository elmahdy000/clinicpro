import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { FilesController } from './files.controller';
import { MAX_FILE_SIZE_BYTES } from './file-validation';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  ],
  controllers: [UploadsController, FilesController],
  providers: [UploadsService],
})
export class UploadsModule {}
