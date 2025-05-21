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
    try {
      const imageUrl = await this.uploadService.uploadFeatureImage(
        file.buffer,
        file.originalname,
      );

      // Trả về URL ảnh
      return { url: imageUrl };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
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

  @Post('audio')
  @UseInterceptors(FileInterceptor('audio')) // Sử dụng FileInterceptor để nhận file audio từ client
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    try {
      // Gọi service để upload audio và trả về URL của file đã upload
      const audioUrl = await this.uploadService.uploadAudio(
        file.buffer,
        file.originalname,
      );

      // Trả về URL audio
      return { url: audioUrl };
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  }

  @Post('multiple-audio')
  @UseInterceptors(FilesInterceptor('audioFiles')) // Cho phép upload nhiều file audio
  async uploadMultipleAudio(@UploadedFiles() files: Express.Multer.File[]) {
    try {
      const uploadedUrls = await Promise.all(
        files.map((file) =>
          this.uploadService.uploadAudio(file.buffer, file.originalname),
        ),
      );

      return { urls: uploadedUrls };
    } catch (error) {
      console.error('Error uploading multiple audio files:', error);
      throw error;
    }
  }
}
