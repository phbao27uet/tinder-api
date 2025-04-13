import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin'; // Firebase Admin SDK
import * as serviceAccount from './serviceAccountKey.json';

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
}
