import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  controllers: [UploadController], // Đăng ký controller
  providers: [UploadService], // Đăng ký service
})
export class UploadModule {}
