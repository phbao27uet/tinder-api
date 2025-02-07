// llm.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@shared/prisma';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class LlmService {
  private embeddingModel: any;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Khởi tạo model embedding khi service được tạo
    this.initEmbeddingModel();
  }

  private gemini = new GoogleGenerativeAI(
    this.configService.get('GEMINI_API_KEY') || '',
  );

  private async initEmbeddingModel() {
    const TransformersApi = Function('return import("@xenova/transformers")')();
    const { pipeline } = await TransformersApi;

    this.embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
    );
  }

  async processProfile(rawProfile: string) {
    try {
      // Bước 1: Trích xuất thông tin có cấu trúc sử dụng Gemini
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const prompt = `Trích xuất JSON gồm: interests[], education, job từ: "${rawProfile}"
      Chỉ trả về JSON hợp lệ có dạng {"interests": string[], "education": string, "job": string}, không kèm theo bất kỳ văn bản nào khác.`;

      const result = await model.generateContent(prompt);
      const extractionText = result.response.text();
      const structuredData = this.formatExtractionText(extractionText);

      // Bước 2: Tạo embeddings sử dụng Sentence Transformers
      const embeddings = await this.embeddingModel(rawProfile);
      const embeddingArray = Array.from(embeddings[0].data);

      return {
        structuredData: structuredData,
        embeddings: embeddingArray as number[],
      };
    } catch (err: any) {
      console.log(err);
      throw new InternalServerErrorException(
        'Lỗi trong quá trình xử lý',
        err?.error?.message,
      );
    }
  }

  formatExtractionText(extractionText: string): {
    interests: string[];
    education: string;
    job: string;
  } {
    const text = extractionText.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(text);
  }
}
