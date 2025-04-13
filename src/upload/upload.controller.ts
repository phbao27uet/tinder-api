import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service'; // Import service để xử lý upload ảnh

@Controller('upload') // Đặt đường dẫn URL cho controller
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single') // Định nghĩa một endpoint POST
  @UseInterceptors(FileInterceptor('file')) // Sử dụng FileInterceptor để nhận file từ client
  async uploadFeatureImage(@UploadedFile() file: Express.Multer.File) {
    // Gọi service để upload ảnh và trả về URL ảnh đã upload
    const imageUrl = await this.uploadService.uploadFeatureImage(
      file.buffer,
      file.originalname,
    );

    // Trả về URL ảnh
    return { url: imageUrl };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files')) // Cho phép tối đa 10 file
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    const uploadedUrls = await Promise.all(
      files.map((file) =>
        this.uploadService.uploadFeatureImage(file.buffer, file.originalname),
      ),
    );

    return { urls: uploadedUrls };
  }
}
