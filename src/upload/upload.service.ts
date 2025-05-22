import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin'; // Firebase Admin SDK
import * as serviceAccount from './serviceAccountKey.json';
import * as path from 'path';

@Injectable()
export class UploadService {
  constructor() {
    // Khởi tạo Firebase Admin SDK (bạn phải cấu hình trước)
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount,
        ), // Đảm bảo bạn có tệp serviceAccountKey.json của Firebase
        storageBucket: 'file-storage-6ac01.appspot.com', // Tên bucket chính xác
      });
    }
  }

  // Hàm để upload ảnh lên Firebase Storage và trả về URL
  async uploadFeatureImage(file: Buffer, filename: string): Promise<string> {
    const bucket = admin.storage().bucket(); // Lấy bucket mặc định từ Firebase
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    // Tạo tên file duy nhất bằng cách sử dụng UUID
    const uniqueFilename = `tinder/images/${year}/${month}/${day}/${filename}`;
    const fileRef = bucket.file(uniqueFilename);

    // Upload file lên Firebase
    await fileRef.save(file, {
      metadata: { contentType: 'image/jpeg' }, // Đảm bảo kiểu file đúng
    });

    // Trả về URL ảnh
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uniqueFilename)}?alt=media`;
  }

  // Hàm để upload audio lên Firebase Storage và trả về URL
  async uploadAudio(file: Buffer, filename: string): Promise<string> {
    const bucket = admin.storage().bucket(); // Lấy bucket mặc định từ Firebase
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');

    // Lấy phần mở rộng của file để xác định content type
    const fileExt = path.extname(filename).toLowerCase();
    let contentType = 'audio/mpeg'; // Mặc định là mp3
    // Xác định content type dựa trên đuôi file
    if (fileExt === '.wav') contentType = 'audio/wav';
    else if (fileExt === '.ogg') contentType = 'audio/ogg';
    else if (fileExt === '.aac') contentType = 'audio/aac';
    else if (fileExt === '.flac') contentType = 'audio/flac';
    // Tạo tên file duy nhất
    const uniqueFilename = `tinder/audio/${year}/${month}/${day}/${filename}`;
    const fileRef = bucket.file(uniqueFilename);

    // Upload file lên Firebase
    await fileRef.save(file, {
      metadata: { contentType }, // Đặt kiểu file phù hợp
    });
    // Trả về URL audio
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uniqueFilename)}?alt=media`;
  }
}
