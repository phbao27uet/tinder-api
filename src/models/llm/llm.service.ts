// llm.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SignUpDto } from '@models/auth/dto/sign-up.dto';
import {
  ALCOHOL_CONSUMPTION,
  COMMUNICATION_STYLE,
  DIETARY_PREFERENCE,
  EDUCATION,
  EXERCISE_FREQUENCY,
  FUTURE_FAMILY,
  GENDER,
  LOOKING_FOR,
  LOVE_LANGUAGE,
  PETS,
  SLEEP_PATTERN,
  SMOKING_PREFERENCE,
  SOCIAL_MEDIA_USAGE,
  ZODIAC_SIGN,
} from '@shared/utils';

@Injectable()
export class LlmService {
  private embeddingModel: any;
  private readonly logger = new Logger(LlmService.name);

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

  async processUserData(_formData: SignUpDto) {
    try {
      const formData = { ..._formData };

      // Bước 1: Xử lý với Gemini để trích xuất các thông tin từ Bio
      const dynamicPrompt = this.createDynamicPrompt(formData.rawProfile);
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent(dynamicPrompt);
      const text = result.response.text();
      const json = this.parseGeminiResponse(text);

      // Bước 2: Tạo combined text trực tiếp từ form data
      formData.interests = [...(formData?.interests || []), ...json.interests];
      const combinedText = this.createCombinedText(formData);

      // Bước 3: Tạo embedding từ combined text
      const embeddings = await this.embeddingModel(combinedText);
      const embeddingArray = Array.from(embeddings[0].data);

      return {
        embeddings: embeddingArray as number[],
        text: combinedText,
      };
    } catch (err: any) {
      this.logger.error(`Lỗi xử lý dữ liệu: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Lỗi xử lý dữ liệu người dùng');
    }
  }

  private createCombinedText(formData: SignUpDto): string {
    return `
    **Thông tin cơ bản**:
    - Tên: ${formData.name || 'Chưa cung cấp'}
    - Ngày sinh: ${formData.birthday || 'Chưa cung cấp'}
    - Giới tính: ${formData.gender ? GENDER[formData.gender] : 'Chưa cung cấp'}
    - Mục tiêu: ${formData.lookingFor ? LOOKING_FOR[formData.lookingFor] : 'Chưa xác định'}
    
    **Sở thích**:
    ${formData.interests?.join(', ') || 'Không có'}
    
    **Ngôn ngữ**:
    ${formData.languages?.join(', ') || 'Không có'}
    
    **Cung hoàng đạo**:
    ${formData.zodiacSign ? ZODIAC_SIGN[formData.zodiacSign] : 'Chưa xác định'}
    
    **Học vấn**:
    ${formData.education ? EDUCATION[formData.education] : 'Chưa cung cấp'}
    
    **Kế hoạch gia đình**:
    ${formData.futureFamily ? FUTURE_FAMILY[formData.futureFamily] : 'Chưa xác định'}
    
    **Phong cách giao tiếp**:
    ${formData.communicationStyle ? COMMUNICATION_STYLE[formData.communicationStyle] : 'Chưa xác định'}
    
    **Ngôn ngữ tình yêu**:
    ${formData.loveLanguage ? LOVE_LANGUAGE[formData.loveLanguage] : 'Chưa xác định'}
    
    **Thú cưng**:
    ${formData.pet ? PETS[formData.pet] : 'Không có'}
    
    **Rượu bia**:
    ${formData.alcoholConsumption ? ALCOHOL_CONSUMPTION[formData.alcoholConsumption] : 'Chưa xác định'}
    
    **Hút thuốc**:
    ${formData.smoking ? SMOKING_PREFERENCE[formData.smoking] : 'Chưa xác định'}
    
    **Tập luyện**:
    ${formData.exerciseHabit ? EXERCISE_FREQUENCY[formData.exerciseHabit] : 'Chưa xác định'}
    
    **Chế độ ăn**:
    ${formData.diet ? DIETARY_PREFERENCE[formData.diet] : 'Chưa xác định'}
    
    **Hoạt động MXH**:
    ${formData.socialMediaActivity ? SOCIAL_MEDIA_USAGE[formData.socialMediaActivity] : 'Chưa xác định'}
    
    **Thói quen ngủ**:
    ${formData.sleepHabit ? SLEEP_PATTERN[formData.sleepHabit] : 'Chưa xác định'}
    `;
  }

  private createDynamicPrompt(rawProfile: string): string {
    return `
      Trích xuất JSON gồm: interests[] từ: "${rawProfile}"
    `;
  }

  private parseGeminiResponse(responseText: string): any {
    try {
      const cleanText = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleanText);
    } catch (err: any) {
      this.logger.error('Lỗi phân tích phản hồi từ Gemini', err.stack);
      throw new InternalServerErrorException('Lỗi xử lý dữ liệu AI');
    }
  }
}
