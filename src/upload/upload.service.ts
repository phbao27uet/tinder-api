// import { Injectable } from '@nestjs/common';
// import * as admin from 'firebase-admin'; // Firebase Admin SDK
// import * as serviceAccount from './serviceAccountKey.json';
// import * as path from 'path';

// @Injectable()
// export class UploadService {
//   constructor() {
//     // Khởi tạo Firebase Admin SDK (bạn phải cấu hình trước)
//     if (!admin.apps.length) {
//       admin.initializeApp({
//         credential: admin.credential.cert(
//           serviceAccount as admin.ServiceAccount,
//         ), // Đảm bảo bạn có tệp serviceAccountKey.json của Firebase
//         storageBucket: 'file-storage-6ac01.appspot.com', // Tên bucket chính xác
//       });
//     }
//   }

//   // Hàm để upload ảnh lên Firebase Storage và trả về URL
//   async uploadFeatureImage(file: Buffer, filename: string): Promise<string> {
//     const bucket = admin.storage().bucket(); // Lấy bucket mặc định từ Firebase
//     const currentDate = new Date();
//     const year = currentDate.getFullYear();
//     const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
//     const day = currentDate.getDate().toString().padStart(2, '0');
//     // Tạo tên file duy nhất bằng cách sử dụng UUID
//     const uniqueFilename = `tinder/images/${year}/${month}/${day}/${filename}`;
//     const fileRef = bucket.file(uniqueFilename);

//     // Upload file lên Firebase
//     await fileRef.save(file, {
//       metadata: { contentType: 'image/jpeg' }, // Đảm bảo kiểu file đúng
//     });

//     // Trả về URL ảnh
//     return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uniqueFilename)}?alt=media`;
//   }

//   // Hàm để upload audio lên Firebase Storage và trả về URL
//   async uploadAudio(file: Buffer, filename: string): Promise<string> {
//     const bucket = admin.storage().bucket(); // Lấy bucket mặc định từ Firebase
//     const currentDate = new Date();
//     const year = currentDate.getFullYear();
//     const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
//     const day = currentDate.getDate().toString().padStart(2, '0');

//     // Lấy phần mở rộng của file để xác định content type
//     const fileExt = path.extname(filename).toLowerCase();
//     let contentType = 'audio/mpeg'; // Mặc định là mp3
//     // Xác định content type dựa trên đuôi file
//     if (fileExt === '.wav') contentType = 'audio/wav';
//     else if (fileExt === '.ogg') contentType = 'audio/ogg';
//     else if (fileExt === '.aac') contentType = 'audio/aac';
//     else if (fileExt === '.flac') contentType = 'audio/flac';
//     // Tạo tên file duy nhất
//     const uniqueFilename = `tinder/audio/${year}/${month}/${day}/${filename}`;
//     const fileRef = bucket.file(uniqueFilename);

//     // Upload file lên Firebase
//     await fileRef.save(file, {
//       metadata: { contentType }, // Đặt kiểu file phù hợp
//     });
//     // Trả về URL audio
//     return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uniqueFilename)}?alt=media`;
//   }
// }

import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;
  private readonly bucketName = 'storage-tinder'; // Tên bucket trong Supabase

  constructor() {
    // Khởi tạo Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL as string, // URL của Supabase project
      process.env.SUPABASE_SERVICE_ROLE_KEY as string, // Service role key (có quyền bypass RLS)
    );
  }

  // Hàm để upload ảnh lên Supabase Storage và trả về URL
  async uploadFeatureImage(file: Buffer, filename: string): Promise<string> {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');

    // Tạo đường dẫn file
    const filePath = `tinder/images/${year}/${month}/${day}/${filename}`;

    // Upload file lên Supabase Storage
    const { data, error } = await this.supabase.storage
      .from(this.bucketName) // Tên bucket trong Supabase
      .upload(filePath, file, {
        contentType: 'image/jpeg',
        upsert: false, // Không ghi đè nếu file đã tồn tại
      });

    if (error) {
      throw new Error(`Upload thất bại: ${error.message}`);
    }

    console.log('Upload data:', data);

    // Lấy public URL của file
    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  // Hàm để upload audio lên Supabase Storage và trả về URL
  async uploadAudio(file: Buffer, filename: string): Promise<string> {
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

    // Tạo đường dẫn file
    const filePath = `tinder/audio/${year}/${month}/${day}/${filename}`;

    // Upload file lên Supabase Storage
    const { data, error } = await this.supabase.storage
      .from(this.bucketName) // Tên bucket trong Supabase
      .upload(filePath, file, {
        contentType,
        upsert: false, // Không ghi đè nếu file đã tồn tại
      });

    console.log('Upload data:', data);

    if (error) {
      throw new Error(`Upload thất bại: ${error.message}`);
    }

    // Lấy public URL của file
    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  // Hàm helper để xóa file (nếu cần)
  async deleteFile(filePath: string): Promise<boolean> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Xóa file thất bại: ${error.message}`);
    }

    return true;
  }

  // Hàm helper để tạo signed URL (URL có thời hạn)
  async createSignedUrl(
    filePath: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Tạo signed URL thất bại: ${error.message}`);
    }

    return data.signedUrl;
  }
}
